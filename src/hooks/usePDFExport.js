import { useState, useRef } from 'react';
import PDFService from '../services/PDFService';

export const usePDFExport = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const printRef = useRef();

  const generatePDF = async (documentData, options = {}) => {
    const {
      method = 'html', // 'html', 'structured', 'simple'
      fileName = `legal-analysis-${Date.now()}.pdf`,
      element = printRef.current
    } = options;

    setIsGenerating(true);
    setError(null);

    try {
      let result;

      switch (method) {
        case 'html':
          if (!element) {
            throw new Error('HTML element reference is required for HTML method');
          }
          result = await PDFService.generatePDFFromHTML(element, fileName);
          break;
          
        case 'structured':
          result = await PDFService.generateStructuredPDF(documentData, fileName);
          break;
          
        case 'simple':
          result = await PDFService.generateSimplePDF(documentData, fileName);
          break;
          
        default:
          throw new Error(`Unknown PDF generation method: ${method}`);
      }

      if (!result.success) {
        throw new Error(result.message || 'PDF generation failed');
      }

      return result;

    } catch (err) {
      const errorMessage = err.message || 'Failed to generate PDF';
      setError(errorMessage);
      console.error('PDF Export Error:', err);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToHTML = async (documentData, fileName) => {
    return generatePDF(documentData, { 
      method: 'html', 
      fileName,
      element: printRef.current 
    });
  };

  const exportToStructured = async (documentData, fileName) => {
    return generatePDF(documentData, { 
      method: 'structured', 
      fileName 
    });
  };

  const exportToSimple = async (documentData, fileName) => {
    return generatePDF(documentData, { 
      method: 'simple', 
      fileName 
    });
  };

  const clearError = () => setError(null);

  return {
    printRef,
    isGenerating,
    error,
    generatePDF,
    exportToHTML,
    exportToStructured,
    exportToSimple,
    clearError
  };
};