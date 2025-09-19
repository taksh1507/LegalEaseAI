const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://taksh1507.github.io',
    'https://legaleaseai-zeuw.onrender.com'
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
      verifyOTP: 'POST /api/auth/verify-otp (email only)'
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
    // Initialize database schema
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Send OTP: POST http://localhost:${PORT}/api/auth/send-otp`);
      console.log(`Verify OTP: POST http://localhost:${PORT}/api/auth/verify-otp`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
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

// Start the server
startServer();