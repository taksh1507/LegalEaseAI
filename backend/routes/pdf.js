const router = require('express').Router();
const PDFService = require('../services/pdfService');
router.get('/health', (req, res) =>
  res.json({
    success: true,
    renderer: 'puppeteer',
    message: 'Renderer is configured; use report generation to verify availability',
  }),
);
router.post('/preview-html', (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { html: PDFService.generateHTMLContent(req.body?.documentData) },
    });
  } catch (error) {
    next(error);
  }
});
router.post('/generate', async (req, res, next) => {
  try {
    const result = await PDFService.generatePDF(req.body?.documentData, req.body?.options);
    res
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="legal-analysis.pdf"',
        'Content-Length': String(result.size),
      })
      .send(result.buffer);
  } catch (error) {
    next(error);
  }
});
router.post('/generate-base64', async (req, res, next) => {
  try {
    const result = await PDFService.generatePDF(req.body?.documentData, req.body?.options);
    res.json({
      success: true,
      data: {
        pdf: result.buffer.toString('base64'),
        size: result.size,
        mimeType: 'application/pdf',
      },
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
