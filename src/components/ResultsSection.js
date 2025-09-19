import React from 'react';
import SummaryCard from './SummaryCard';
import ClauseAccordion from './ClauseAccordion';
import RedFlagSidebar from './RedFlagSidebar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ResultsSection = ({ documentData, onNewDocument }) => {
  if (!documentData) return null;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onNewDocument}
            className="flex items-center space-x-2 text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-accent-100 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Upload New Document</span>
          </button>
          
          <div className="text-sm text-accent-500 dark:text-accent-400">
            Processed: {new Date(documentData.processedAt).toLocaleString()}
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-accent-900 dark:text-accent-100">
          Document Analysis: {documentData.fileName}
        </h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Summary Card */}
          <SummaryCard summary={documentData.summary} />
          
          {/* Clause Accordion */}
          <ClauseAccordion clauses={documentData.clauses} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <RedFlagSidebar redFlags={documentData.redFlags} />
        </div>
      </div>
    </div>
  );
};

export default ResultsSection;