import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

class PDFService {
  /**
   * Generate PDF from HTML element using html2canvas
   */
  static async generatePDFFromHTML(element, fileName = 'legal-analysis-report.pdf') {
    try {
      // Configure html2canvas options for better quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit PDF
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Top margin
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20); // Account for margins
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10; // Offset for new page
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }
      
      // Save the PDF
      pdf.save(fileName);
      return { success: true, message: 'PDF generated successfully' };
      
    } catch (error) {
      console.error('PDF generation error:', error);
      return { success: false, message: 'Failed to generate PDF', error };
    }
  }

  /**
   * Generate structured PDF using jsPDF directly
   */
  static async generateStructuredPDF(documentData, fileName = 'legal-analysis-report.pdf') {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 7;
      let yPosition = margin;

      // Helper function to add new page if needed
      const checkPageHeight = (additionalHeight = lineHeight) => {
        if (yPosition + additionalHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Helper function to add text with word wrapping
      const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        for (let i = 0; i < lines.length; i++) {
          checkPageHeight();
          pdf.text(lines[i], x, yPosition);
          yPosition += lineHeight;
        }
        return yPosition;
      };

      // Header
      pdf.setFillColor(37, 99, 235); // Blue color
      pdf.rect(0, 0, pageWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LegalEaseAI', margin, 15);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Legal Document Analysis Report', margin, 20);
      
      // Date
      pdf.setFontSize(10);
      pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 30, 15);
      
      yPosition = 35;
      pdf.setTextColor(0, 0, 0);

      // Document Information Section
      checkPageHeight(20);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Document Information', margin, yPosition);
      yPosition += lineHeight + 3;
      
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const docInfo = [
        `Document Name: ${documentData.fileName || 'Unknown Document'}`,
        `Overall Risk Level: ${(documentData.overallRiskLevel || 'medium').toUpperCase()}`,
        `Total Clauses Analyzed: ${documentData.clauses?.length || 0}`,
        `Issues Identified: ${documentData.redFlags?.length || 0}`,
        `Analysis Date: ${new Date(documentData.processedAt).toLocaleString()}`
      ];
      
      docInfo.forEach(info => {
        checkPageHeight();
        pdf.text(info, margin, yPosition);
        yPosition += lineHeight;
      });
      
      yPosition += 5;

      // Executive Summary
      if (documentData.summary) {
        checkPageHeight(20);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Executive Summary', margin, yPosition);
        yPosition += lineHeight + 3;
        
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
        
        if (documentData.summary.title) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          addWrappedText(documentData.summary.title, margin, yPosition, pageWidth - 2 * margin, 12);
          yPosition += 3;
        }
        
        if (documentData.summary.description) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          addWrappedText(documentData.summary.description, margin, yPosition, pageWidth - 2 * margin);
          yPosition += 3;
        }
        
        if (documentData.summary.keyPoints && documentData.summary.keyPoints.length > 0) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          checkPageHeight();
          pdf.text('Key Points:', margin, yPosition);
          yPosition += lineHeight;
          
          pdf.setFont('helvetica', 'normal');
          documentData.summary.keyPoints.forEach(point => {
            checkPageHeight();
            addWrappedText(`• ${point}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
          });
        }
        
        yPosition += 5;
      }

      // Risk Assessment
      if (documentData.redFlags && documentData.redFlags.length > 0) {
        checkPageHeight(20);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Risk Assessment & Critical Issues', margin, yPosition);
        yPosition += lineHeight + 3;
        
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
        
        documentData.redFlags.forEach((flag, index) => {
          checkPageHeight(15);
          
          // Risk item header
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          const severityColor = this.getSeverityColor(flag.severity);
          pdf.setTextColor(severityColor.r, severityColor.g, severityColor.b);
          
          addWrappedText(`${index + 1}. ${flag.issue} [${(flag.severity || 'medium').toUpperCase()}]`, 
                        margin, yPosition, pageWidth - 2 * margin, 12);
          
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          
          if (flag.explanation) {
            addWrappedText(flag.explanation, margin + 5, yPosition, pageWidth - 2 * margin - 5);
          }
          
          if (flag.potentialConsequences) {
            pdf.setFont('helvetica', 'bold');
            checkPageHeight();
            pdf.text('Potential Consequences:', margin + 5, yPosition);
            yPosition += lineHeight;
            
            pdf.setFont('helvetica', 'normal');
            addWrappedText(flag.potentialConsequences, margin + 10, yPosition, pageWidth - 2 * margin - 10);
          }
          
          if (flag.recommendations) {
            pdf.setFont('helvetica', 'bold');
            checkPageHeight();
            pdf.text('Recommendations:', margin + 5, yPosition);
            yPosition += lineHeight;
            
            pdf.setFont('helvetica', 'normal');
            addWrappedText(flag.recommendations, margin + 10, yPosition, pageWidth - 2 * margin - 10);
          }
          
          yPosition += 8;
        });
      }

      // Recommendations
      if (documentData.recommendations && documentData.recommendations.length > 0) {
        checkPageHeight(20);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Recommendations', margin, yPosition);
        yPosition += lineHeight + 3;
        
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        documentData.recommendations.forEach((rec, index) => {
          checkPageHeight();
          addWrappedText(`${index + 1}. ${rec}`, margin, yPosition, pageWidth - 2 * margin);
          yPosition += 3;
        });
      }

      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
        pdf.text('Generated by LegalEaseAI', margin, pageHeight - 10);
      }

      // Save the PDF
      pdf.save(fileName);
      return { success: true, message: 'PDF generated successfully' };
      
    } catch (error) {
      console.error('Structured PDF generation error:', error);
      return { success: false, message: 'Failed to generate PDF', error };
    }
  }

  /**
   * Get color values for severity levels
   */
  static getSeverityColor(severity) {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return { r: 220, g: 38, b: 38 };
      case 'high':
        return { r: 239, g: 68, b: 68 };
      case 'medium':
        return { r: 245, g: 158, b: 11 };
      case 'low':
        return { r: 16, g: 185, b: 129 };
      default:
        return { r: 107, g: 114, b: 128 };
    }
  }

  /**
   * Generate simple text-based PDF
   */
  static async generateSimplePDF(documentData, fileName = 'legal-analysis-summary.pdf') {
    try {
      const pdf = new jsPDF();
      
      pdf.setFontSize(16);
      pdf.text('Legal Document Analysis Report', 20, 20);
      
      pdf.setFontSize(12);
      let yPos = 40;
      
      // Document info
      pdf.text(`Document: ${documentData.fileName}`, 20, yPos);
      yPos += 10;
      pdf.text(`Risk Level: ${documentData.overallRiskLevel}`, 20, yPos);
      yPos += 10;
      pdf.text(`Date: ${new Date(documentData.processedAt).toLocaleDateString()}`, 20, yPos);
      yPos += 20;
      
      // Summary
      if (documentData.summary?.description) {
        pdf.text('Summary:', 20, yPos);
        yPos += 10;
        const summaryLines = pdf.splitTextToSize(documentData.summary.description, 170);
        pdf.text(summaryLines, 20, yPos);
        yPos += summaryLines.length * 5 + 10;
      }
      
      // Key issues
      if (documentData.redFlags?.length > 0) {
        pdf.text('Key Issues:', 20, yPos);
        yPos += 10;
        
        documentData.redFlags.slice(0, 5).forEach((flag, index) => {
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(`${index + 1}. ${flag.issue}`, 25, yPos);
          yPos += 7;
        });
      }
      
      pdf.save(fileName);
      return { success: true, message: 'Simple PDF generated successfully' };
      
    } catch (error) {
      console.error('Simple PDF generation error:', error);
      return { success: false, message: 'Failed to generate simple PDF', error };
    }
  }
}

export default PDFService;