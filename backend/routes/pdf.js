const express = require('express');
const BackendPDFService = require('../services/pdfService');
const router = express.Router();

/**
 * Generate PDF from document analysis data
 * POST /api/pdf/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { documentData, options = {} } = req.body;
    
    if (!documentData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required'
      });
    }

    // Generate PDF
    const result = await BackendPDFService.generatePDF(documentData, options);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'PDF generation failed',
        error: result.error
      });
    }

    // Set response headers for PDF download
    const fileName = `legal-analysis-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', result.size);
    
    // Send PDF buffer
    res.send(result.buffer);
    
  } catch (error) {
    console.error('PDF generation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during PDF generation',
      error: error.message
    });
  }
});

/**
 * Generate PDF and return as base64
 * POST /api/pdf/generate-base64
 */
router.post('/generate-base64', async (req, res) => {
  try {
    const { documentData, options = {} } = req.body;
    
    if (!documentData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required'
      });
    }

    // Generate PDF
    const result = await BackendPDFService.generatePDF(documentData, options);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'PDF generation failed',
        error: result.error
      });
    }

    // Convert buffer to base64
    const base64PDF = result.buffer.toString('base64');
    
    res.json({
      success: true,
      data: {
        pdf: base64PDF,
        size: result.size,
        mimeType: 'application/pdf'
      },
      message: 'PDF generated successfully'
    });
    
  } catch (error) {
    console.error('PDF base64 generation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during PDF generation',
      error: error.message
    });
  }
});

/**
 * Preview PDF HTML content
 * POST /api/pdf/preview-html
 */
router.post('/preview-html', async (req, res) => {
  try {
    const { documentData } = req.body;
    
    if (!documentData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required'
      });
    }

    // Generate HTML content
    const htmlContent = BackendPDFService.generateHTMLContent(documentData);
    
    res.json({
      success: true,
      data: {
        html: htmlContent
      },
      message: 'HTML content generated successfully'
    });
    
  } catch (error) {
    console.error('HTML preview route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during HTML generation',
      error: error.message
    });
  }
});

/**
 * Health check for PDF service
 * GET /api/pdf/health
 */
router.get('/health', async (req, res) => {
  try {
    // Test with minimal document data
    const testData = {
      fileName: 'Test Document',
      summary: { title: 'Test Summary' },
      clauses: [],
      redFlags: [],
      overallRiskLevel: 'low',
      recommendations: [],
      processedAt: new Date()
    };

    const result = await BackendPDFService.generatePDF(testData, { method: 'html-pdf-node' });
    
    res.json({
      success: true,
      pdfServiceHealthy: result.success,
      message: result.success ? 'PDF service is healthy' : 'PDF service has issues',
      testPdfSize: result.success ? result.size : null,
      error: result.success ? null : result.error
    });
    
  } catch (error) {
    console.error('PDF health check error:', error);
    res.status(500).json({
      success: false,
      pdfServiceHealthy: false,
      message: 'PDF service health check failed',
      error: error.message
    });
  }
});

module.exports = router;