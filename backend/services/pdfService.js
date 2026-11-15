const puppeteer = require('puppeteer');
const httpError = require('../utils/httpError');
const { integerSetting } = require('../config/security');
let activeRenders = 0;

function escapeText(value, depth = 0, count = { value: 0 }) {
  if (depth > 12 || ++count.value > 10000) throw httpError(413, 'Report structure is too large');
  if (typeof value === 'string')
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
    );
  if (Array.isArray(value)) return value.map((item) => escapeText(item, depth + 1, count));
  if (value && typeof value === 'object' && !(value instanceof Date))
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, escapeText(item, depth + 1, count)]),
    );
  return value;
}
function validateReport(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw httpError(400, 'Document data is required');
  for (const key of ['fileName', 'overallRiskLevel'])
    if (data[key] !== undefined && typeof data[key] !== 'string')
      throw httpError(400, `Invalid ${key}`);
  for (const key of ['summary', 'favorability'])
    if (
      data[key] !== undefined &&
      (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key]))
    )
      throw httpError(400, `Invalid ${key}`);
  for (const key of ['clauses', 'redFlags']) {
    if (data[key] !== undefined && (!Array.isArray(data[key]) || data[key].length > 500))
      throw httpError(400, `Invalid ${key}`);
    for (const item of data[key] || []) {
      if (!item || typeof item !== 'object' || Array.isArray(item))
        throw httpError(400, `Invalid ${key} entry`);
      for (const field of [
        'title',
        'originalText',
        'explanation',
        'riskLevel',
        'riskAssessment',
        'legalImplications',
        'negotiationPoints',
        'importance',
        'issue',
        'severity',
        'potentialConsequences',
        'recommendations',
      ])
        if (item[field] !== undefined && typeof item[field] !== 'string')
          throw httpError(400, `Invalid report field: ${field}`);
      if (
        item.keyTerms !== undefined &&
        (!Array.isArray(item.keyTerms) || !item.keyTerms.every((term) => typeof term === 'string'))
      )
        throw httpError(400, 'Invalid clause key terms');
    }
  }
  for (const key of ['recommendations', 'missingClauses'])
    if (
      data[key] !== undefined &&
      (!Array.isArray(data[key]) || !data[key].every((item) => typeof item === 'string'))
    )
      throw httpError(400, `Invalid ${key}`);
  if (
    data.summary?.keyPoints !== undefined &&
    (!Array.isArray(data.summary.keyPoints) ||
      !data.summary.keyPoints.every((item) => typeof item === 'string'))
  )
    throw httpError(400, 'Invalid summary key points');
  for (const [object, keys] of [
    [data.summary, ['title', 'description']],
    [data.favorability, ['forParty1', 'forParty2', 'explanation']],
  ])
    for (const key of keys)
      if (object?.[key] !== undefined && typeof object[key] !== 'string')
        throw httpError(400, `Invalid report field: ${key}`);
  if (data.processedAt !== undefined && Number.isNaN(new Date(data.processedAt).getTime()))
    throw httpError(400, 'Invalid report date');
}

function safeOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options))
    throw httpError(400, 'Invalid PDF options');
  const allowed = new Set(['method', 'format', 'landscape', 'scale', 'fileName']);
  for (const key of Object.keys(options))
    if (!allowed.has(key)) throw httpError(400, `Unsupported PDF option: ${key}`);
  if (options.method && !['puppeteer', 'html-pdf-node'].includes(options.method))
    throw httpError(400, 'Unsupported PDF method');
  if (options.format && !['A4', 'Letter', 'Legal'].includes(options.format))
    throw httpError(400, 'Unsupported paper format');
  if (options.landscape !== undefined && typeof options.landscape !== 'boolean')
    throw httpError(400, 'Invalid page orientation');
  if (
    options.scale !== undefined &&
    (typeof options.scale !== 'number' || options.scale < 0.5 || options.scale > 1.5)
  )
    throw httpError(400, 'Invalid PDF scale');
  return {
    format: options.format || 'A4',
    landscape: options.landscape || false,
    scale: options.scale || 1,
  };
}

class BackendPDFService {
  static async generatePDFWithPuppeteer(htmlContent, options = {}) {
    if (activeRenders >= integerSetting('PDF_MAX_CONCURRENCY', 2, 1, 4))
      throw httpError(503, 'Report renderer is busy. Please retry.');
    activeRenders += 1;
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args:
          process.env.PDF_DISABLE_SANDBOX === 'true'
            ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            : [],
        timeout: 15000,
      });
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', (request) => request.abort());
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const buffer = Buffer.from(
        await page.pdf({
          ...options,
          printBackground: true,
          margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
          timeout: 30000,
        }),
      );
      return { success: true, buffer, size: buffer.length };
    } catch {
      throw httpError(503, 'PDF renderer unavailable. Please retry later.');
    } finally {
      activeRenders -= 1;
      if (browser) await browser.close();
    }
  }

  static generateHTMLContent(documentData) {
    validateReport(documentData);
    for (const field of ['clauses', 'redFlags', 'recommendations', 'missingClauses']) {
      if (
        documentData[field] !== undefined &&
        (!Array.isArray(documentData[field]) || documentData[field].length > 500)
      )
        throw httpError(400, `Invalid ${field}`);
    }
    documentData = escapeText(documentData);
    const {
      fileName = 'Unknown Document',
      summary = {},
      clauses = [],
      redFlags = [],
      overallRiskLevel = 'unknown',
      recommendations = [],
      missingClauses = [],
      favorability = {},
      processedAt = new Date(),
    } = documentData;

    const getRiskColor = (level) => {
      switch (level?.toLowerCase()) {
        case 'low':
          return '#10B981';
        case 'medium':
          return '#F59E0B';
        case 'high':
          return '#EF4444';
        default:
          return '#6B7280';
      }
    };

    const getSeverityColor = (severity) => {
      switch (severity?.toLowerCase()) {
        case 'critical':
          return '#DC2626';
        case 'high':
          return '#EF4444';
        case 'medium':
          return '#F59E0B';
        case 'low':
          return '#10B981';
        default:
          return '#6B7280';
      }
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Legal Document Analysis Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: white;
            font-size: 14px;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
        }
        
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            color: #2563eb;
            font-size: 28px;
            font-weight: bold;
        }
        
        .header .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        
        .header .date-info {
            text-align: right;
            font-size: 12px;
            color: #6b7280;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section h2 {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        
        .section h3 {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .doc-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
        }
        
        .doc-info-item {
            display: flex;
            flex-direction: column;
        }
        
        .doc-info-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
        }
        
        .doc-info-value {
            color: #6b7280;
        }
        
        .risk-level {
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .summary-box {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        
        .key-points {
            list-style: none;
            padding: 0;
        }
        
        .key-points li {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
            position: relative;
            padding-left: 20px;
        }
        
        .key-points li:before {
            content: "•";
            color: #2563eb;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .risk-item {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .risk-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        
        .risk-title {
            font-weight: 600;
            font-size: 16px;
        }
        
        .severity-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: white;
        }
        
        .clause-item {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .clause-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        
        .clause-badges {
            display: flex;
            gap: 8px;
        }
        
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .original-text {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            font-style: italic;
            margin: 10px 0;
            border-left: 3px solid #d1d5db;
        }
        
        .recommendations-box {
            background: #dbeafe;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        
        .recommendations-list {
            list-style: none;
            padding: 0;
        }
        
        .recommendations-list li {
            padding: 8px 0;
            position: relative;
            padding-left: 20px;
        }
        
        .recommendations-list li:before {
            content: "✓";
            color: #2563eb;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .missing-clauses-box {
            background: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
        }
        
        .favorability-box {
            background: #f3e8ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #8b5cf6;
        }
        
        .favorability-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .footer {
            border-top: 3px solid #2563eb;
            padding-top: 20px;
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact !important; }
            .section { page-break-inside: avoid; }
            .risk-item, .clause-item { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div>
                <h1>LegalEaseAI</h1>
                <div class="subtitle">Legal Document Analysis Report</div>
            </div>
            <div class="date-info">
                <div>Generated: ${new Date(processedAt).toLocaleDateString()}</div>
                <div>Time: ${new Date(processedAt).toLocaleTimeString()}</div>
            </div>
        </div>

        <!-- Document Information -->
        <div class="section">
            <h2>Document Information</h2>
            <div class="doc-info">
                <div class="doc-info-item">
                    <div class="doc-info-label">Document Name</div>
                    <div class="doc-info-value">${fileName}</div>
                </div>
                <div class="doc-info-item">
                    <div class="doc-info-label">Overall Risk Level</div>
                    <div class="doc-info-value">
                        <span class="risk-level" style="color: ${getRiskColor(overallRiskLevel)}">
                            ${overallRiskLevel}
                        </span>
                    </div>
                </div>
                <div class="doc-info-item">
                    <div class="doc-info-label">Total Clauses Analyzed</div>
                    <div class="doc-info-value">${clauses.length}</div>
                </div>
                <div class="doc-info-item">
                    <div class="doc-info-label">Issues Identified</div>
                    <div class="doc-info-value">${redFlags.length}</div>
                </div>
            </div>
        </div>

        <!-- Executive Summary -->
        ${
          summary.title || summary.description
            ? `
        <div class="section">
            <h2>Executive Summary</h2>
            <div class="summary-box">
                ${summary.title ? `<h3>${summary.title}</h3>` : ''}
                ${summary.description ? `<p>${summary.description}</p>` : ''}
                ${
                  summary.keyPoints && summary.keyPoints.length > 0
                    ? `
                    <h4 style="margin-top: 20px; margin-bottom: 10px;">Key Points:</h4>
                    <ul class="key-points">
                        ${summary.keyPoints.map((point) => `<li>${point}</li>`).join('')}
                    </ul>
                `
                    : ''
                }
            </div>
        </div>
        `
            : ''
        }

        <!-- Risk Assessment -->
        ${
          redFlags.length > 0
            ? `
        <div class="section">
            <h2>Risk Assessment & Critical Issues</h2>
            ${redFlags
              .map(
                (flag) => `
                <div class="risk-item">
                    <div class="risk-header">
                        <div class="risk-title">${flag.issue}</div>
                        <div class="severity-badge" style="background-color: ${getSeverityColor(flag.severity)}">
                            ${(flag.severity || 'medium').toUpperCase()}
                        </div>
                    </div>
                    ${flag.explanation ? `<p><strong>Explanation:</strong> ${flag.explanation}</p>` : ''}
                    ${flag.potentialConsequences ? `<p><strong>Potential Consequences:</strong> ${flag.potentialConsequences}</p>` : ''}
                    ${flag.recommendations ? `<p><strong>Recommendations:</strong> ${flag.recommendations}</p>` : ''}
                </div>
            `,
              )
              .join('')}
        </div>
        `
            : ''
        }

        <!-- Detailed Clause Analysis -->
        ${
          clauses.length > 0
            ? `
        <div class="section">
            <h2>Detailed Clause Analysis</h2>
            ${clauses
              .map(
                (clause) => `
                <div class="clause-item">
                    <div class="clause-header">
                        <h3>${clause.title}</h3>
                        <div class="clause-badges">
                            <span class="badge" style="background-color: ${getRiskColor(clause.riskLevel)}; color: white;">
                                ${(clause.riskLevel || 'medium').toUpperCase()} RISK
                            </span>
                            ${
                              clause.importance
                                ? `
                                <span class="badge" style="background-color: #6b7280; color: white;">
                                    ${clause.importance.toUpperCase()}
                                </span>
                            `
                                : ''
                            }
                        </div>
                    </div>
                    
                    ${
                      clause.originalText
                        ? `
                        <div>
                            <strong>Original Text:</strong>
                            <div class="original-text">"${clause.originalText}"</div>
                        </div>
                    `
                        : ''
                    }
                    
                    ${clause.explanation ? `<p><strong>Analysis:</strong> ${clause.explanation}</p>` : ''}
                    ${clause.riskAssessment ? `<p><strong>Risk Assessment:</strong> ${clause.riskAssessment}</p>` : ''}
                    ${clause.legalImplications ? `<p><strong>Legal Implications:</strong> ${clause.legalImplications}</p>` : ''}
                    ${clause.negotiationPoints ? `<p><strong>Negotiation Points:</strong> ${clause.negotiationPoints}</p>` : ''}
                    ${clause.keyTerms && clause.keyTerms.length > 0 ? `<p><strong>Key Terms:</strong> ${clause.keyTerms.join(', ')}</p>` : ''}
                </div>
            `,
              )
              .join('')}
        </div>
        `
            : ''
        }

        <!-- Recommendations -->
        ${
          recommendations.length > 0
            ? `
        <div class="section">
            <h2>Recommendations</h2>
            <div class="recommendations-box">
                <ul class="recommendations-list">
                    ${recommendations.map((rec) => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
        `
            : ''
        }

        <!-- Missing Clauses -->
        ${
          missingClauses.length > 0
            ? `
        <div class="section">
            <h2>Missing or Recommended Clauses</h2>
            <div class="missing-clauses-box">
                <ul class="recommendations-list">
                    ${missingClauses.map((clause) => `<li>${clause}</li>`).join('')}
                </ul>
            </div>
        </div>
        `
            : ''
        }

        <!-- Document Favorability -->
        ${
          favorability.explanation && favorability.explanation !== 'Analysis not available'
            ? `
        <div class="section">
            <h2>Document Favorability Assessment</h2>
            <div class="favorability-box">
                <div class="favorability-grid">
                    <div>
                        <strong>Party 1 Favorability:</strong>
                        <span style="margin-left: 8px; font-weight: bold; text-transform: capitalize;">
                            ${favorability.forParty1}
                        </span>
                    </div>
                    <div>
                        <strong>Party 2 Favorability:</strong>
                        <span style="margin-left: 8px; font-weight: bold; text-transform: capitalize;">
                            ${favorability.forParty2}
                        </span>
                    </div>
                </div>
                <div>
                    <strong>Assessment:</strong> ${favorability.explanation}
                </div>
            </div>
        </div>
        `
            : ''
        }

        <!-- Footer -->
        <div class="footer">
            <div>
                <div>This report was generated by LegalEaseAI for informational purposes only.</div>
                <div>Please consult with qualified legal counsel for professional advice.</div>
            </div>
            <div>
                <div>LegalEaseAI © 2024</div>
                <div>AI-Powered Legal Analysis</div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Main method to generate PDF with fallback options
   */
  static async generatePDF(documentData, options = {}) {
    const pdfOptions = safeOptions(options);
    const htmlContent = this.generateHTMLContent(documentData);
    return this.generatePDFWithPuppeteer(htmlContent, pdfOptions);
  }
}
module.exports = BackendPDFService;
