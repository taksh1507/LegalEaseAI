import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon 
} from '@heroicons/react/24/outline';

const ClauseAccordion = ({ clauses }) => {
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
        {clauses.map((clause) => (
          <div key={clause.id} className="transition-all duration-200">
            {/* Clause Header */}
            <button
              onClick={() => toggleClause(clause.id)}
              className={`w-full p-6 text-left hover:bg-accent-50 dark:hover:bg-accent-800/50 transition-colors duration-200 ${
                expandedClause === clause.id ? getRiskColor(clause.riskLevel) : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {getRiskIcon(clause.riskLevel)}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-accent-900 dark:text-accent-100">
                      {clause.title}
                    </h3>
                    <p className="text-sm text-accent-600 dark:text-accent-400 mt-1 line-clamp-2">
                      {clause.originalText.substring(0, 150)}...
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(clause.riskLevel)}`}>
                      {clause.riskLevel.charAt(0).toUpperCase() + clause.riskLevel.slice(1)} Risk
                    </span>
                    
                    {expandedClause === clause.id ? (
                      <ChevronDownIcon className="h-5 w-5 text-accent-500" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-accent-500" />
                    )}
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {expandedClause === clause.id && (
              <div className={`border-l-4 ${getRiskColor(clause.riskLevel)} animate-slide-up`}>
                <div className="p-6 space-y-6">
                  {/* Original Text */}
                  <div>
                    <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                      Original Clause Text
                    </h4>
                    <div className="bg-accent-100 dark:bg-accent-800 p-4 rounded-lg">
                      <p className="text-sm text-accent-800 dark:text-accent-200 italic">
                        "{clause.originalText}"
                      </p>
                    </div>
                  </div>

                  {/* Plain Language Explanation */}
                  <div>
                    <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                      What This Means
                    </h4>
                    <p className="text-accent-900 dark:text-accent-100">
                      {clause.explanation}
                    </p>
                  </div>

                  {/* Risk Assessment */}
                  {clause.riskAssessment && (
                    <div>
                      <h4 className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                        Risk Assessment
                      </h4>
                      <div className={`p-4 rounded-lg border-l-4 ${
                        clause.riskLevel === 'high' ? 'border-l-danger-500 bg-danger-50 dark:bg-danger-900/20' :
                        clause.riskLevel === 'medium' ? 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20' :
                        'border-l-success-500 bg-success-50 dark:bg-success-900/20'
                      }`}>
                        <p className="text-sm text-accent-800 dark:text-accent-200">
                          {clause.riskAssessment}
                        </p>
                      </div>
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
        ))}
      </div>
    </div>
  );
};

export default ClauseAccordion;