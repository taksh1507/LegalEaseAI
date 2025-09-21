import React from 'react';
import { 
  ClockIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const PDFTemplate = React.forwardRef(({ documentData }, ref) => {
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

  return (
    <div ref={ref} className="pdf-template bg-white text-black p-8 min-h-screen">
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              LegalEaseAI
            </h1>
            <p className="text-lg text-gray-600">
              Legal Document Analysis Report
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Generated on: {new Date(processedAt).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">
              Time: {new Date(processedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Document Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
          Document Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Document Name:</strong> {fileName}
          </div>
          <div>
            <strong>Overall Risk Level:</strong> 
            <span 
              style={{ color: getRiskColor(overallRiskLevel) }}
              className="font-semibold ml-2 uppercase"
            >
              {overallRiskLevel}
            </span>
          </div>
          <div>
            <strong>Total Clauses Analyzed:</strong> {clauses.length}
          </div>
          <div>
            <strong>Issues Identified:</strong> {redFlags.length}
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
          Executive Summary
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">{summary.title || 'Document Analysis'}</h3>
          <p className="text-gray-700 mb-4">{summary.description || 'Analysis completed'}</p>
          
          {summary.keyPoints && summary.keyPoints.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Key Points:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {summary.keyPoints.map((point, index) => (
                  <li key={index} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Risk Assessment */}
      {redFlags.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
            Risk Assessment & Critical Issues
          </h2>
          <div className="space-y-4">
            {redFlags.map((flag, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: getSeverityColor(flag.severity) }}
                  ></div>
                  <h3 className="text-lg font-semibold">{flag.issue}</h3>
                  <span 
                    className="ml-auto px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: getSeverityColor(flag.severity) }}
                  >
                    {flag.severity?.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{flag.explanation}</p>
                {flag.potentialConsequences && (
                  <div className="mb-2">
                    <strong>Potential Consequences:</strong> {flag.potentialConsequences}
                  </div>
                )}
                {flag.recommendations && (
                  <div>
                    <strong>Recommendations:</strong> {flag.recommendations}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Detailed Clause Analysis */}
      {clauses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
            Detailed Clause Analysis
          </h2>
          <div className="space-y-6">
            {clauses.map((clause, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{clause.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: getRiskColor(clause.riskLevel) }}
                    >
                      {clause.riskLevel?.toUpperCase()} RISK
                    </span>
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold bg-gray-200 text-gray-800"
                    >
                      {clause.importance?.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {clause.originalText && (
                  <div className="mb-3">
                    <strong>Original Text:</strong>
                    <div className="bg-gray-100 p-3 rounded mt-1 text-sm italic">
                      "{clause.originalText}"
                    </div>
                  </div>
                )}
                
                <div className="mb-3">
                  <strong>Analysis:</strong> {clause.explanation}
                </div>
                
                {clause.riskAssessment && (
                  <div className="mb-3">
                    <strong>Risk Assessment:</strong> {clause.riskAssessment}
                  </div>
                )}
                
                {clause.legalImplications && (
                  <div className="mb-3">
                    <strong>Legal Implications:</strong> {clause.legalImplications}
                  </div>
                )}
                
                {clause.negotiationPoints && (
                  <div className="mb-3">
                    <strong>Negotiation Points:</strong> {clause.negotiationPoints}
                  </div>
                )}
                
                {clause.keyTerms && clause.keyTerms.length > 0 && (
                  <div>
                    <strong>Key Terms:</strong> {clause.keyTerms.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
            Recommendations
          </h2>
          <div className="bg-blue-50 p-4 rounded-lg">
            <ul className="list-disc pl-5 space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-gray-700">{rec}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Missing Clauses */}
      {missingClauses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
            Missing or Recommended Clauses
          </h2>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <ul className="list-disc pl-5 space-y-2">
              {missingClauses.map((clause, index) => (
                <li key={index} className="text-gray-700">{clause}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Document Favorability */}
      {favorability.explanation && favorability.explanation !== 'Analysis not available' && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
            Document Favorability Assessment
          </h2>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <strong>Party 1 Favorability:</strong> 
                <span className="ml-2 font-semibold capitalize">
                  {favorability.forParty1}
                </span>
              </div>
              <div>
                <strong>Party 2 Favorability:</strong> 
                <span className="ml-2 font-semibold capitalize">
                  {favorability.forParty2}
                </span>
              </div>
            </div>
            <div>
              <strong>Assessment:</strong> {favorability.explanation}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="border-t-2 border-blue-600 pt-6 mt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              This report was generated by LegalEaseAI for informational purposes only.
            </p>
            <p className="text-sm text-gray-500">
              Please consult with qualified legal counsel for professional advice.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              LegalEaseAI © 2024
            </p>
            <p className="text-sm text-gray-500">
              AI-Powered Legal Analysis
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .pdf-template {
            font-size: 12px !important;
            line-height: 1.4 !important;
          }
          
          h1 {
            font-size: 24px !important;
          }
          
          h2 {
            font-size: 18px !important;
            page-break-after: avoid;
          }
          
          h3 {
            font-size: 14px !important;
            page-break-after: avoid;
          }
          
          .border, .border-gray-300 {
            border: 1px solid #d1d5db !important;
          }
          
          .bg-gray-50, .bg-blue-50, .bg-yellow-50, .bg-purple-50 {
            background-color: #f9fafb !important;
          }
          
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
});

PDFTemplate.displayName = 'PDFTemplate';

export default PDFTemplate;