import React from 'react';
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const RedFlagSidebar = ({ redFlags }) => {
  const getIconForSeverity = (severity) => {
    switch (severity) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" />;
      case 'warning':
        return <ShieldExclamationIcon className="h-5 w-5 text-warning-500" />;
      case 'notice':
        return <ClockIcon className="h-5 w-5 text-primary-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-accent-500" />;
    }
  };

  const getColorForSeverity = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-l-danger-500 bg-danger-50 dark:bg-danger-900/20';
      case 'warning':
        return 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20';
      case 'notice':
        return 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20';
      default:
        return 'border-l-accent-300 bg-accent-50 dark:bg-accent-800/50';
    }
  };

  const getBadgeColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300';
      case 'warning':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300';
      case 'notice':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300';
      default:
        return 'bg-accent-100 text-accent-800 dark:bg-accent-700 dark:text-accent-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Red Flags Card */}
      <div className="card sticky top-20">
        <div className="p-6 border-b border-accent-200 dark:border-accent-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-danger-100 dark:bg-danger-900/30 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-danger-600 dark:text-danger-400" />
            </div>
            <h2 className="text-xl font-bold text-accent-900 dark:text-accent-100">
              Red Flags
            </h2>
          </div>
          <p className="text-sm text-accent-600 dark:text-accent-400 mt-2">
            Important clauses that require your attention
          </p>
        </div>

        <div className="p-6">
          {redFlags.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-full w-fit mx-auto mb-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-success-600 dark:text-success-400" />
              </div>
              <p className="text-accent-600 dark:text-accent-400">
                No major red flags detected in this document.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {redFlags.map((flag) => (
                <div
                  key={flag.id}
                  className={`border-l-4 p-4 rounded-lg ${getColorForSeverity(flag.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getIconForSeverity(flag.severity)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(flag.severity)}`}>
                        {flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1)}
                      </span>
                    </div>
                    <span className="text-xs text-accent-500 dark:text-accent-400">
                      Clause {flag.clauseNumber}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">
                    {flag.title}
                  </h3>
                  
                  <p className="text-sm text-accent-700 dark:text-accent-300 mb-3">
                    {flag.description}
                  </p>
                  
                  {flag.recommendation && (
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
              <span className="text-sm text-accent-600 dark:text-accent-400">Critical Issues</span>
              <span className="px-2 py-1 bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300 text-sm rounded-full">
                {redFlags.filter(flag => flag.severity === 'critical').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-accent-600 dark:text-accent-400">Warnings</span>
              <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 text-sm rounded-full">
                {redFlags.filter(flag => flag.severity === 'warning').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-accent-600 dark:text-accent-400">Notices</span>
              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-sm rounded-full">
                {redFlags.filter(flag => flag.severity === 'notice').length}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-accent-200 dark:border-accent-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-900 dark:text-accent-100">
                {redFlags.length === 0 ? 'Low' : 
                 redFlags.filter(flag => flag.severity === 'critical').length > 0 ? 'High' :
                 redFlags.filter(flag => flag.severity === 'warning').length > 0 ? 'Medium' : 'Low'}
              </div>
              <div className="text-sm text-accent-600 dark:text-accent-400">Overall Risk Level</div>
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