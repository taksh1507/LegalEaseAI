import React, { useState } from 'react';
import { 
  XMarkIcon, 
  DocumentArrowDownIcon,
  EyeIcon,
  Cog6ToothIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import PDFTemplate from './PDFTemplate';
import { usePDFExport } from '../hooks/usePDFExport';
import BackendPDFAPI from '../services/BackendPDFAPI';

const PDFPreviewModal = ({ isOpen, onClose, documentData }) => {
  const [selectedFormat, setSelectedFormat] = useState('structured');
  const [fileName, setFileName] = useState('');
  const [useBackendGeneration, setUseBackendGeneration] = useState(false);
  const { 
    printRef, 
    isGenerating, 
    error, 
    exportToHTML, 
    exportToStructured, 
    exportToSimple,
    clearError 
  } = usePDFExport();

  const backendPDFAPI = new BackendPDFAPI();

  if (!isOpen) return null;

  const generateFileName = () => {
    const docName = documentData?.fileName?.replace(/\.[^/.]+$/, '') || 'legal-analysis';
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${docName}-${timestamp}.pdf`;
  };

  const handleExport = async () => {
    const finalFileName = fileName || generateFileName();
    
    try {
      clearError();
      
      if (useBackendGeneration) {
        // Use backend PDF generation
        await backendPDFAPI.generateAndDownloadPDF(documentData, {
          fileName: finalFileName,
          method: selectedFormat === 'html' ? 'puppeteer' : 'html-pdf-node'
        });
      } else {
        // Use frontend PDF generation
        switch (selectedFormat) {
          case 'html':
            await exportToHTML(documentData, finalFileName);
            break;
          case 'structured':
            await exportToStructured(documentData, finalFileName);
            break;
          case 'simple':
            await exportToSimple(documentData, finalFileName);
            break;
          default:
            throw new Error('Invalid export format selected');
        }
      }
      
      // Show success message
      alert('PDF exported successfully!');
      onClose();
      
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message}`);
      // Error is handled by the hook for frontend generation
    }
  };

  const formatDescriptions = {
    html: {
      title: 'High-Quality HTML to PDF',
      description: 'Preserves exact formatting and styling. Best visual quality but larger file size.',
      pros: ['Perfect visual fidelity', 'Preserves colors and layout', 'Professional appearance'],
      cons: ['Larger file size', 'Slower generation'],
      backendSupported: true
    },
    structured: {
      title: 'Structured PDF',
      description: 'Native PDF generation with optimized layout. Good balance of quality and size.',
      pros: ['Smaller file size', 'Fast generation', 'Clean typography'],
      cons: ['Basic styling only', 'Limited visual customization'],
      backendSupported: true
    },
    simple: {
      title: 'Simple Text PDF',
      description: 'Basic text-only format. Fastest generation and smallest file size.',
      pros: ['Very fast', 'Smallest file', 'Universal compatibility'],
      cons: ['No styling', 'Basic layout only'],
      backendSupported: false
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DocumentArrowDownIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Export PDF Report
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose format and customize your analysis report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Export Options */}
            <div className="lg:col-span-1 space-y-6">
              {/* File Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder={generateFileName()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Generation Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Generation Method
                </label>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="generation"
                      checked={!useBackendGeneration}
                      onChange={() => setUseBackendGeneration(false)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Frontend Generation
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Generate PDF in your browser. Works offline and faster for simple documents.
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="generation"
                      checked={useBackendGeneration}
                      onChange={() => setUseBackendGeneration(true)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          Server Generation
                        </div>
                        <CloudIcon className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        High-quality server-side PDF generation. Better for complex layouts.
                      </div>
                    </div>
                  </label>
                </div>
                
                {useBackendGeneration && !formatDescriptions[selectedFormat].backendSupported && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-700 dark:text-yellow-300">
                    ⚠️ Selected format not supported with server generation. Will use frontend generation instead.
                  </div>
                )}
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Export Format
                </label>
                <div className="space-y-3">
                  {Object.entries(formatDescriptions).map(([key, format]) => (
                    <div key={key} className="relative">
                      <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <input
                          type="radio"
                          name="format"
                          value={key}
                          checked={selectedFormat === key}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {format.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {format.description}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Format Details */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {formatDescriptions[selectedFormat].title}
                </h4>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Pros:</span>
                    <ul className="text-xs text-gray-600 dark:text-gray-300 ml-2">
                      {formatDescriptions[selectedFormat].pros.map((pro, index) => (
                        <li key={index}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Cons:</span>
                    <ul className="text-xs text-gray-600 dark:text-gray-300 ml-2">
                      {formatDescriptions[selectedFormat].cons.map((con, index) => (
                        <li key={index}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="text-sm text-red-600 dark:text-red-400">
                    <strong>Export Error:</strong> {error}
                  </div>
                </div>
              )}

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={isGenerating}
                className={`w-full btn-primary flex items-center justify-center space-x-2 ${
                  isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-5 w-5" />
                    <span>Export PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Preview ({selectedFormat === 'html' ? 'HTML Template' : 'Visual Representation'})
                    </span>
                  </div>
                </div>
                
                <div className="bg-white p-4 max-h-96 overflow-y-auto">
                  {selectedFormat === 'html' ? (
                    <div className="transform scale-50 origin-top-left w-[200%]">
                      <PDFTemplate ref={printRef} documentData={documentData} />
                    </div>
                  ) : (
                    <div className="space-y-4 text-sm">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-blue-600">LegalEaseAI</h3>
                        <p className="text-gray-600">Legal Document Analysis Report</p>
                        <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
                      </div>
                      
                      <hr />
                      
                      <div>
                        <h4 className="font-semibold">Document Information</h4>
                        <p>Document Name: {documentData?.fileName}</p>
                        <p>Risk Level: {documentData?.overallRiskLevel?.toUpperCase()}</p>
                        <p>Issues Found: {documentData?.redFlags?.length || 0}</p>
                      </div>
                      
                      {documentData?.summary?.description && (
                        <div>
                          <h4 className="font-semibold">Executive Summary</h4>
                          <p className="text-gray-600">{documentData.summary.description.substring(0, 200)}...</p>
                        </div>
                      )}
                      
                      {documentData?.redFlags?.length > 0 && (
                        <div>
                          <h4 className="font-semibold">Key Issues</h4>
                          <ul className="list-disc pl-4">
                            {documentData.redFlags.slice(0, 3).map((flag, index) => (
                              <li key={index} className="text-gray-600">{flag.issue}</li>
                            ))}
                            {documentData.redFlags.length > 3 && (
                              <li className="text-gray-500">... and {documentData.redFlags.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      <div className="text-center text-xs text-gray-500 border-t pt-2">
                        Generated by LegalEaseAI © 2024
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;