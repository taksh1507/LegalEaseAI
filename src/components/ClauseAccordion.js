import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon 
} from '@heroicons/react/24/outline';

const ClauseAccordion = ({ clauses = [] }) => {
  const [expandedClause, setExpandedClause] = useState(null);

  const toggleClause = (clauseId) => {
    setExpandedClause(expandedClause === clauseId ? null : clauseId);
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" />;
      case 'medium':
        return <ShieldExclamationIcon className="h-5 w-5 text-warning-500" />;
      case 'low':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-accent-500" />;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return 'border-l-danger-500 bg-danger-50 dark:bg-danger-900/10';
      case 'medium':
        return 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/10';
      case 'low':
        return 'border-l-success-500 bg-success-50 dark:bg-success-900/10';
      default:
        return 'border-l-accent-300 bg-accent-50 dark:bg-accent-800/50';
    }
  };

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300';
      case 'medium':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300';
      case 'low':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300';
      default:
        return 'bg-accent-100 text-accent-800 dark:bg-accent-700 dark:text-accent-300';
    }
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-accent-200 dark:border-accent-700">
        <h2 className="text-2xl font-bold text-accent-900 dark:text-accent-100">
          Clause-by-Clause Analysis
        </h2>
        <p className="text-accent-600 dark:text-accent-400 mt-2">
          Click on any clause to see its plain-language explanation and risk assessment
        </p>
      </div>

      <div className="divide-y divide-accent-200 dark:divide-accent-700">
        {clauses.length > 0 ? (
          clauses.map((clause, index) => (
            <div key={clause.id || index} className="transition-all duration-200">
            {/* Clause Header */}
            <button
              onClick={() => toggleClause(clause.id || index)}
              className={`w-full p-6 text-left hover:bg-accent-50 dark:hover:bg-accent-800/50 transition-colors duration-200 ${
                expandedClause === (clause.id || index) ? getRiskColor(clause.riskLevel || 'low') : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {getRiskIcon(clause.riskLevel || 'low')}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-accent-900 dark:text-accent-100">
                      {clause.title || 'Untitled Clause'}
                    </h3>
                    <p className="text-sm text-accent-600 dark:text-accent-400 mt-1 line-clamp-2">
                      {(clause.originalText || '').substring(0, 150)}{(clause.originalText || '').length > 150 ? '...' : ''}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(clause.riskLevel || 'low')}`}>
                      {(clause.riskLevel || 'low').charAt(0).toUpperCase() + (clause.riskLevel || 'low').slice(1)} Risk
                    </span>
                    
                    {expandedClause === (clause.id || index) ? (
                      <ChevronDownIcon className="h-5 w-5 text-accent-500" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-accent-500" />
                    )}
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {expandedClause === (clause.id || index) && (
              <div className={`border-l-4 ${getRiskColor(clause.riskLevel || 'low')} animate-slide-up`}>
                <div className="p-6 space-y-6">
                  {/* Original Text */}
                  <div>
                    <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                      Original Clause Text
                    </h4>
                    <div className="bg-accent-100 dark:bg-accent-800 p-4 rounded-lg">
                      <p className="text-sm text-accent-800 dark:text-accent-200 italic">
                        "{clause.originalText || 'No original text available'}"
                      </p>
                    </div>
                  </div>

                  {/* Plain Language Explanation */}
                  <div>
                    <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                      What This Means
                    </h4>
                    <p className="text-accent-900 dark:text-accent-100">
                      {clause.explanation || 'No explanation available'}
                    </p>
                  </div>

                  {/* Risk Assessment */}
                  {clause.riskAssessment && (
                    <div>
                      <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                        Risk Assessment
                      </h4>
                      <div className={`p-4 rounded-lg border-l-4 ${
                        (clause.riskLevel || 'low') === 'high' ? 'border-l-danger-500 bg-danger-50 dark:bg-danger-900/20' :
                        (clause.riskLevel || 'low') === 'medium' ? 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20' :
                        'border-l-success-500 bg-success-50 dark:bg-success-900/20'
                      }`}>
                        <p className="text-sm text-accent-800 dark:text-accent-200">
                          {clause.riskAssessment || 'No risk assessment available'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Key Points */}
                  <div>
                    <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                      Key Points
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <ul className="space-y-2">
                        {/* Extract key points from various clause properties */}
                        {clause.keyTerms && clause.keyTerms.length > 0 && (
                          <li className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-2"></div>
                            <span className="text-sm text-accent-700 dark:text-accent-300">
                              <strong>Key Terms:</strong> {clause.keyTerms.join(', ')}
                            </span>
                          </li>
                        )}
                        
                        {clause.legalImplications && (
                          <li className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-2"></div>
                            <span className="text-sm text-accent-700 dark:text-accent-300">
                              <strong>Legal Impact:</strong> {clause.legalImplications}
                            </span>
                          </li>
                        )}
                        
                        {clause.industryStandard && (
                          <li className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-2"></div>
                            <span className="text-sm text-accent-700 dark:text-accent-300">
                              <strong>Industry Standard:</strong> {clause.industryStandard}
                            </span>
                          </li>
                        )}
                        
                        {clause.importance && (
                          <li className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-2"></div>
                            <span className="text-sm text-accent-700 dark:text-accent-300">
                              <strong>Importance Level:</strong> {clause.importance.charAt(0).toUpperCase() + clause.importance.slice(1)}
                            </span>
                          </li>
                        )}
                        
                        {/* If no specific data available, show a default key point */}
                        {(!clause.keyTerms || clause.keyTerms.length === 0) && !clause.legalImplications && !clause.industryStandard && (
                          <li className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-2"></div>
                            <span className="text-sm text-accent-700 dark:text-accent-300">
                              This clause requires careful review and understanding of its implications.
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Legal Implications */}
                  {clause.legalImplications && (
                    <div>
                      <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                        Legal Implications
                      </h4>
                      <p className="text-accent-800 dark:text-accent-200 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        {clause.legalImplications}
                      </p>
                    </div>
                  )}

                  {/* Negotiation Points */}
                  {clause.negotiationPoints && (
                    <div>
                      <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                        Negotiation Opportunities
                      </h4>
                      <p className="text-accent-800 dark:text-accent-200 text-sm bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                        {clause.negotiationPoints}
                      </p>
                    </div>
                  )}

                  {/* Industry Standard Assessment */}
                  {clause.industryStandard && (
                    <div>
                      <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                        Industry Standard Assessment
                      </h4>
                      <p className="text-accent-800 dark:text-accent-200 text-sm bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        {clause.industryStandard}
                      </p>
                    </div>
                  )}

                  {/* Key Terms */}
                  {clause.keyTerms && clause.keyTerms.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                        Key Terms to Note
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {clause.keyTerms.map((term, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-sm rounded-full"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {clause.recommendations && clause.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {clause.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-2"></div>
                            <span className="text-sm text-accent-700 dark:text-accent-300">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          ))
        ) : (
          <div className="p-6 text-center">
            <p className="text-accent-600 dark:text-accent-400">
              No clauses available for analysis yet. Upload a document to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClauseAccordion;