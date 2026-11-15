const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { isUtf8 } = require('node:buffer');
const mammoth = require('mammoth');
const ai = require('../services/aiService');
const pool = require('../config/database');
const httpError = require('../utils/httpError');
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
});

async function extractFile(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension === '.txt') {
    if (!isUtf8(file.buffer) || file.buffer.includes(0))
      throw httpError(400, 'Upload a UTF-8 text file');
    return file.buffer.toString('utf8');
  }
  if (extension === '.pdf') {
    if (!file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-')))
      throw httpError(400, 'Invalid PDF file');
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: file.buffer, isEvalSupported: false });
    try {
      return (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  }
  if (extension === '.docx') {
    await require('../utils/validateDocx')(file.buffer);
    return (await mammoth.extractRawText({ buffer: file.buffer, externalFileAccess: false })).value;
  }
  if (extension === '.doc') {
    if (!file.buffer.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex')))
      throw httpError(400, 'Invalid Word document');
    const WordExtractor = require('word-extractor');
    return (await new WordExtractor().extract(file.buffer)).getBody();
  }
  throw httpError(415, 'Upload a PDF, DOC, DOCX or UTF-8 TXT file');
}
router.post('/analyze-file', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) throw httpError(400, 'No file uploaded');
    let text;
    try {
      text = await extractFile(req.file);
    } catch (error) {
      throw error.status
        ? error
        : httpError(
            400,
            'Could not read this document. Use an unencrypted PDF, Word document or UTF-8 text file.',
          );
    }
    const analysis = await ai.analyzeDocument(text);
    res.json({
      success: true,
      data: analysis,
      fileInfo: {
        name: path.basename(req.file.originalname),
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
});
for (const endpoint of ['/analyze-text', '/analyze'])
  router.post(endpoint, async (req, res, next) => {
    try {
      res.json({ success: true, data: await ai.analyzeDocument(req.body?.text || req.body?.file) });
    } catch (error) {
      next(error);
    }
  });
router.post('/chat', async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        response: await ai.generateChatResponse(req.body?.message, req.body?.context),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});
router.get('/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) throw httpError(400, 'Invalid document ID');
    const result = await pool.query(
      'SELECT id, title, file_type, file_size, analysis_result, created_at FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId],
    );
    if (!result.rows[0]) throw httpError(404, 'Document not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
