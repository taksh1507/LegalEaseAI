const express = require('express');
const { randomUUID } = require('node:crypto');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const pool = require('./config/database');
const { integerSetting } = require('./config/security');

function limiter(limit) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  });
}
function createApp() {
  const app = express();
  if (process.env.TRUST_PROXY_HOPS)
    app.set('trust proxy', integerSetting('TRUST_PROXY_HOPS', 0, 0, 5));
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    res.on('finish', () => {
      if (res.statusCode >= 500)
        console.error(
          JSON.stringify({
            event: 'request_failed',
            requestId: req.requestId,
            method: req.method,
            route: req.route?.path || 'middleware',
            status: res.statusCode,
          }),
        );
    });
    next();
  });
  app.use(helmet());
  const origins = (
    process.env.CORS_ORIGINS ||
    (process.env.NODE_ENV === 'production'
      ? ''
      : 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173')
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.includes(origin)) callback(null, true);
        else callback(Object.assign(new Error('Origin is not allowed'), { status: 403 }));
      },
    }),
  );
  app.use(limiter(integerSetting('API_RATE_LIMIT', 200, 1, 10000)));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));
  app.get('/health', (req, res) =>
    res.json({ success: true, service: 'LegalEaseAI', status: 'alive' }),
  );
  app.get('/ready', async (req, res) => {
    try {
      if (!pool) throw new Error('Database is not configured');
      await pool.query(
        'SELECT token_version FROM users LIMIT 0; SELECT user_id FROM document_history LIMIT 0; SELECT id FROM auth_challenges LIMIT 0',
      );
      res.json({ success: true, status: 'ready' });
    } catch {
      res.status(503).json({ success: false, status: 'not ready' });
    }
  });
  app.get('/', (req, res) =>
    res.json({ service: 'LegalEaseAI API', health: '/health', readiness: '/ready' }),
  );
  app.use(
    '/api/auth',
    limiter(integerSetting('AUTH_RATE_LIMIT', 30, 1, 10000)),
    require('./routes/auth'),
  );
  const { authenticateToken, requireVerifiedContact } = require('./middleware/auth');
  const costLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: integerSetting('DOCUMENT_RATE_LIMIT', 30, 1, 1000),
    keyGenerator: (req) => String(req.userId),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Document service limit reached. Please retry later.' },
  });
  app.use(
    '/api/document',
    authenticateToken,
    requireVerifiedContact,
    costLimit,
    require('./routes/document'),
  );
  app.use(
    '/api/chat',
    authenticateToken,
    requireVerifiedContact,
    costLimit,
    require('./routes/chat'),
  );
  app.use('/api/document-history', require('./routes/documentHistory'));
  app.use(
    '/api/pdf',
    authenticateToken,
    requireVerifiedContact,
    costLimit,
    require('./routes/pdf'),
  );
  app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let status =
      Number.isInteger(error.status) && error.status >= 400 && error.status < 600
        ? error.status
        : 500;
    if (error.code === 'LIMIT_FILE_SIZE') status = 413;
    else if (typeof error.code === 'string' && error.code.startsWith('LIMIT_')) status = 400;
    const message =
      status < 500 && !error.type
        ? error.message
        : status === 413
          ? 'Request is too large'
          : status === 400
            ? 'Invalid request'
            : error.status
              ? error.message
              : 'Service unavailable. Please retry later.';
    res.status(status).json({ success: false, message, requestId: req.requestId });
  });
  return app;
}
module.exports = { createApp };
