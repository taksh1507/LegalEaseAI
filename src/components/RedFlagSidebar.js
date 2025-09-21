import React from 'react';
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const RedFlagSidebar = ({ redFlags, clauses = [] }) => {
  // Calculate clause counts by risk level
  const getClauseCounts = () => {
    const counts = {
      high: 0,
      medium: 0,
      low: 0,
      notice: 0
    };

    // Count from clauses
    clauses.forEach(clause => {
      const risk = clause.riskLevel || 'medium';
      if (risk === 'high') counts.high++;
      else if (risk === 'medium') counts.medium++;
      else if (risk === 'low') counts.low++;
    });

    // Count from redFlags
    redFlags.forEach(flag => {
      const severity = flag.severity || 'medium';
      if (severity === 'critical' || severity === 'high') counts.high++;
      else if (severity === 'medium' || severity === 'warning') counts.medium++;
      else if (severity === 'low') counts.low++;
      else if (severity === 'notice') counts.notice++;
    });

    return counts;
  };

  const clauseCounts = getClauseCounts();
  const getIconForSeverity = (severity) => {
    switch (severity) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" />;
      case 'medium':
      case 'warning':
        return <ShieldExclamationIcon className="h-5 w-5 text-warning-500" />;
      case 'low':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'notice':
        return <ClockIcon className="h-5 w-5 text-primary-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-accent-500" />;
    }
  };

  const getColorForSeverity = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'border-l-danger-500 bg-danger-50 dark:bg-danger-900/20';
      case 'medium':
      case 'warning':
        return 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20';
      case 'low':
        return 'border-l-success-500 bg-success-50 dark:bg-success-900/20';
      case 'notice':
        return 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20';
      default:
        return 'border-l-accent-300 bg-accent-50 dark:bg-accent-800/50';
    }
  };

  const getBadgeColor = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300';
      case 'medium':
      case 'warning':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300';
      case 'low':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300';
      case 'notice':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300';
      default:
        return 'bg-accent-100 text-accent-800 dark:bg-accent-700 dark:text-accent-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Items Card */}
      <div className="card sticky top-20">
        <div className="p-6 border-b border-accent-200 dark:border-accent-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-accent-900 dark:text-accent-100">
              Analysis Items
            </h2>
          </div>
          <p className="text-sm text-accent-600 dark:text-accent-400 mt-2">
            Important clauses requiring attention (risks) and favorable terms (benefits)
          </p>
        </div>

        <div className="p-6">
          {redFlags.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-full w-fit mx-auto mb-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-success-600 dark:text-success-400" />
              </div>
              <p className="text-accent-600 dark:text-accent-400">
                No analysis items detected yet. Upload a document to see detailed insights.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {redFlags.map((flag, index) => (
                <div
                  key={flag.id || index}
                  className={`border-l-4 p-4 rounded-lg ${getColorForSeverity(flag.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getIconForSeverity(flag.severity)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(flag.severity)}`}>
                        {flag.severity ? flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1) : 'Medium'}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">
                    {flag.severity === 'low' ? '✅ ' : ''}
                    {flag.issue || flag.title || 'Issue Identified'}
                  </h3>
                  
                  <p className="text-sm text-accent-700 dark:text-accent-300 mb-3">
                    {flag.explanation || flag.description || 'No explanation available'}
                  </p>

                  {/* Potential Consequences */}
                  {flag.potentialConsequences && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-accent-700 dark:text-accent-300 mb-1">
                        {flag.severity === 'low' ? 'Benefits Provided:' : 'Potential Consequences:'}
                      </h4>
                      <p className={`text-xs text-accent-600 dark:text-accent-400 p-2 rounded border ${
                        flag.severity === 'low' 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                        {flag.potentialConsequences}
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {flag.recommendations && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-accent-700 dark:text-accent-300 mb-1">
                        {flag.severity === 'low' ? 'How to Maintain/Leverage:' : 'Recommended Actions:'}
                      </h4>
                      <p className="text-xs text-accent-600 dark:text-accent-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                        {flag.recommendations}
                      </p>
                    </div>
                  )}

                  {/* Legal Citations */}
                  {flag.legalCitations && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-accent-700 dark:text-accent-300 mb-1">
                        Legal Reference:
                      </h4>
                      <p className="text-xs text-accent-600 dark:text-accent-400 bg-gray-50 dark:bg-gray-900/20 p-2 rounded border border-gray-200 dark:border-gray-800 italic">
                        {flag.legalCitations}
                      </p>
                    </div>
                  )}
                  
                  {(flag.recommendation && !flag.recommendations) && (
                    <div className="text-xs text-accent-600 dark:text-accent-400 bg-white/50 dark:bg-accent-800/50 p-2 rounded">
                      <strong>Recommendation:</strong> {flag.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Risk Summary Card */}
      <div className="card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4">
            Risk Summary
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-accent-600 dark:text-accent-400">🚨 Critical/High Issues</span>
              <span className="px-2 py-1 bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300 text-sm rounded-full">
                {clauseCounts.high}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-accent-600 dark:text-accent-400">⚠️ Medium/Warnings</span>
              <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 text-sm rounded-full">
                {clauseCounts.medium}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-accent-600 dark:text-accent-400">✅ Favorable/Low Risk</span>
              <span className="px-2 py-1 bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300 text-sm rounded-full">
                {clauseCounts.low}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-accent-600 dark:text-accent-400">ℹ️ Notices</span>
              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-sm rounded-full">
                {clauseCounts.notice}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-accent-200 dark:border-accent-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-900 dark:text-accent-100">
                {clauseCounts.high > 0 ? 'High' :
                 clauseCounts.medium > 0 ? 'Medium' : 'Low'}
              </div>
              <div className="text-sm text-accent-600 dark:text-accent-400">Overall Risk Level</div>
              <div className="text-xs text-accent-500 dark:text-accent-400 mt-1">
                {clauseCounts.high + clauseCounts.medium + clauseCounts.low + clauseCounts.notice} total items analyzed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="card">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-accent-900 dark:text-accent-100 mb-2">
            Legal Disclaimer
          </h3>
          <p className="text-xs text-accent-600 dark:text-accent-400 leading-relaxed">
            This AI analysis is for informational purposes only and should not be considered legal advice. 
            Always consult with a qualified attorney for important legal matters.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RedFlagSidebar;