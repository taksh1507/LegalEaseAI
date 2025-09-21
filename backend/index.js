const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/document');
const chatRoutes = require('./routes/chat');
const documentHistoryRoutes = require('./routes/documentHistory');
const pdfRoutes = require('./routes/pdf');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://taksh1507.github.io',
    /https:\/\/.*\.onrender\.com$/
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LegalEase AI Authentication API - Email Only',
    version: '1.0.0',
    authentication: 'Email OTP verification only',
    endpoints: {
      health: '/health',
      sendOTP: 'POST /api/auth/send-otp (email only)',
      verifyOTP: 'POST /api/auth/verify-otp (email only)',
      analyzeFile: 'POST /api/document/analyze-file',
      analyzeText: 'POST /api/document/analyze-text',
      chat: {
        conversations: 'GET /api/chat/conversations',
        createConversation: 'POST /api/chat/conversations',
        getMessages: 'GET /api/chat/conversations/:id/messages',
        sendMessage: 'POST /api/chat/conversations/:id/messages'
      },
      documentHistory: {
        getUserHistory: 'GET /api/document-history',
        createHistory: 'POST /api/document-history',
        getHistoryById: 'GET /api/document-history/:id',
        deleteHistory: 'DELETE /api/document-history/:id',
        clearHistory: 'DELETE /api/document-history',
        getStats: 'GET /api/document-history/stats'
      },
      pdf: {
        generate: 'POST /api/pdf/generate',
        generateBase64: 'POST /api/pdf/generate-base64',
        previewHtml: 'POST /api/pdf/preview-html',
        health: 'GET /api/pdf/health'
      }
    },
    configuration: {
      database: process.env.DATABASE_URL ? '✅ Configured' : '❌ Not configured',
      jwtSecret: process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your_super_secret_jwt_key_here' ? '✅ Configured' : '❌ Not configured',
      emailService: process.env.SMTP_USER && process.env.SMTP_USER !== 'your_email@gmail.com' ? '✅ Configured' : '❌ Not configured'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/document-history', documentHistoryRoutes);
app.use('/api/pdf', pdfRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database schema (will handle connection errors gracefully)
    await initializeDatabase();
    console.log('✅ Database initialization completed');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📧 Send OTP: POST http://localhost:${PORT}/api/auth/send-otp`);
      console.log(`🔐 Verify OTP: POST http://localhost:${PORT}/api/auth/verify-otp`);
      console.log(`📄 Document Analysis: POST http://localhost:${PORT}/api/document/analyze`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('🔧 Attempting to start server without database...');

    // Try to start server anyway
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT} (limited functionality)`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();