const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { analyzeDocument } = require('../services/aiService');

// Configure multer for file uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOC, DOCX, TXT files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.'));
    }
  }
});

// POST /api/document/analyze-file
router.post('/analyze-file', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Extract text content from file buffer
    let textContent = '';
    const fileType = req.file.mimetype;
    
    if (fileType === 'text/plain') {
      textContent = req.file.buffer.toString('utf-8');
    } else if (fileType === 'application/pdf') {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        textContent = pdfData.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return res.status(400).json({
          success: false,
          message: 'Failed to parse PDF file. Please ensure the PDF contains readable text.'
        });
      }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileType === 'application/msword') {
      try {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        textContent = result.value;
      } catch (wordError) {
        console.error('Word document parsing error:', wordError);
        return res.status(400).json({
          success: false,
          message: 'Failed to parse Word document. Please ensure the document is not corrupted.'
        });
      }
    }

    if (!textContent.trim()) {
      return res.status(400).json({
        success: false,
        message: 'File appears to be empty or could not extract text content'
      });
    }

    // Use AI service to analyze document
    const analysis = await analyzeDocument(textContent);
    
    res.json({
      success: true,
      data: analysis,
      message: 'Document analyzed successfully',
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Document analysis failed',
      error: error.message
    });
  }
});

// POST /api/document/analyze-text
router.post('/analyze-text', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Text content is required'
      });
    }

    // Use AI service to analyze text
    const analysis = await analyzeDocument(text);
    
    res.json({
      success: true,
      data: analysis,
      message: 'Text analyzed successfully'
    });
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Text analysis failed',
      error: error.message
    });
  }
});

// POST /api/document/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Use AI service for chat response
    const { generateChatResponse } = require('../services/aiService');
    const response = await generateChatResponse(message, context);
    
    res.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString()
      },
      message: 'Chat response generated successfully'
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Chat response failed',
      error: error.message
    });
  }
});

// Legacy route for backward compatibility
// POST /api/document/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { text, file } = req.body;
    const content = file || text;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Text or file content is required'
      });
    }

    const analysis = await analyzeDocument(content);
    
    res.json({
      success: true,
      data: analysis,
      message: 'Document analyzed successfully'
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Document analysis failed',
      error: error.message
    });
  }
});

// GET /api/document/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement document retrieval logic
    res.json({ 
      success: true,
      message: 'Document retrieval endpoint - implementation pending',
      id 
    });
  } catch (error) {
    console.error('Document retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Document retrieval failed',
      error: error.message
    });
  }
});

module.exports = router;
