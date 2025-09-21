const puppeteer = require('puppeteer');
const htmlPdf = require('html-pdf-node');
const fs = require('fs').promises;
const path = require('path');

class BackendPDFService {
  /**
   * Generate PDF using Puppeteer for high-quality output
   */
  static async generatePDFWithPuppeteer(htmlContent, options = {}) {
    let browser = null;
    
    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set content and wait for any images/fonts to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Configure PDF options
      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        ...options
      };
      
      // Generate PDF buffer
      const pdfBuffer = await page.pdf(pdfOptions);
      
      return {
        success: true,
        buffer: pdfBuffer,
        size: pdfBuffer.length
      };
      
    } catch (error) {
      console.error('Puppeteer PDF generation error:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate PDF using html-pdf-node (lighter alternative)
   */
  static async generatePDFWithHtmlPdfNode(htmlContent, options = {}) {
    try {
      const file = { content: htmlContent };
      
      const pdfOptions = {
        format: 'A4',
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        printBackground: true,
        ...options
      };
      
      const pdfBuffer = await htmlPdf.generatePdf(file, pdfOptions);
      
      return {
        success: true,
        buffer: pdfBuffer,
        size: pdfBuffer.length
      };
      
    } catch (error) {
      console.error('html-pdf-node generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create HTML content from document data
   */
  static generateHTMLContent(documentData) {
    const {
      fileName = 'Unknown Document',
      summary = {},
      clauses = [],
      redFlags = [],
      overallRiskLevel = 'medium',
      recommendations = [],
      missingClauses = [],
      favorability = {},
      processedAt = new Date()
    } = documentData;

    const getRiskColor = (level) => {
      switch (level?.toLowerCase()) {
        case 'low': return '#10B981';
        case 'medium': return '#F59E0B';
        case 'high': return '#EF4444';
        default: return '#6B7280';
      }
    };

    const getSeverityColor = (severity) => {
      switch (severity?.toLowerCase()) {
        case 'critical': return '#DC2626';
        case 'high': return '#EF4444';
        case 'medium': return '#F59E0B';
        case 'low': return '#10B981';
        default: return '#6B7280';
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
        ${summary.title || summary.description ? `
        <div class="section">
            <h2>Executive Summary</h2>
            <div class="summary-box">
                ${summary.title ? `<h3>${summary.title}</h3>` : ''}
                ${summary.description ? `<p>${summary.description}</p>` : ''}
                ${summary.keyPoints && summary.keyPoints.length > 0 ? `
                    <h4 style="margin-top: 20px; margin-bottom: 10px;">Key Points:</h4>
                    <ul class="key-points">
                        ${summary.keyPoints.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        </div>
        ` : ''}

        <!-- Risk Assessment -->
        ${redFlags.length > 0 ? `
        <div class="section">
            <h2>Risk Assessment & Critical Issues</h2>
            ${redFlags.map(flag => `
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
            `).join('')}
        </div>
        ` : ''}

        <!-- Detailed Clause Analysis -->
        ${clauses.length > 0 ? `
        <div class="section">
            <h2>Detailed Clause Analysis</h2>
            ${clauses.map(clause => `
                <div class="clause-item">
                    <div class="clause-header">
                        <h3>${clause.title}</h3>
                        <div class="clause-badges">
                            <span class="badge" style="background-color: ${getRiskColor(clause.riskLevel)}; color: white;">
                                ${(clause.riskLevel || 'medium').toUpperCase()} RISK
                            </span>
                            ${clause.importance ? `
                                <span class="badge" style="background-color: #6b7280; color: white;">
                                    ${clause.importance.toUpperCase()}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${clause.originalText ? `
                        <div>
                            <strong>Original Text:</strong>
                            <div class="original-text">"${clause.originalText}"</div>
                        </div>
                    ` : ''}
                    
                    ${clause.explanation ? `<p><strong>Analysis:</strong> ${clause.explanation}</p>` : ''}
                    ${clause.riskAssessment ? `<p><strong>Risk Assessment:</strong> ${clause.riskAssessment}</p>` : ''}
                    ${clause.legalImplications ? `<p><strong>Legal Implications:</strong> ${clause.legalImplications}</p>` : ''}
                    ${clause.negotiationPoints ? `<p><strong>Negotiation Points:</strong> ${clause.negotiationPoints}</p>` : ''}
                    ${clause.keyTerms && clause.keyTerms.length > 0 ? `<p><strong>Key Terms:</strong> ${clause.keyTerms.join(', ')}</p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Recommendations -->
        ${recommendations.length > 0 ? `
        <div class="section">
            <h2>Recommendations</h2>
            <div class="recommendations-box">
                <ul class="recommendations-list">
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}

        <!-- Missing Clauses -->
        ${missingClauses.length > 0 ? `
        <div class="section">
            <h2>Missing or Recommended Clauses</h2>
            <div class="missing-clauses-box">
                <ul class="recommendations-list">
                    ${missingClauses.map(clause => `<li>${clause}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}

        <!-- Document Favorability -->
        ${favorability.explanation && favorability.explanation !== 'Analysis not available' ? `
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
        ` : ''}

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
    const { method = 'puppeteer', ...pdfOptions } = options;
    
    try {
      const htmlContent = this.generateHTMLContent(documentData);
      
      let result;
      if (method === 'html-pdf-node') {
        result = await this.generatePDFWithHtmlPdfNode(htmlContent, pdfOptions);
      } else {
        // Default to Puppeteer
        result = await this.generatePDFWithPuppeteer(htmlContent, pdfOptions);
      }
      
      // If primary method fails, try fallback
      if (!result.success && method === 'puppeteer') {
        console.log('Puppeteer failed, falling back to html-pdf-node');
        result = await this.generatePDFWithHtmlPdfNode(htmlContent, pdfOptions);
      }
      
      return result;
      
    } catch (error) {
      console.error('PDF generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = BackendPDFService;