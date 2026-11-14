const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!pool) {
      return res.status(503).json({ success: false, message: 'Authentication service unavailable' });
    }

    // Get user details from database
    let userResult;
    try {
      const userQuery = 'SELECT id, email, name, created_at FROM users WHERE id = $1';
      userResult = await pool.query(userQuery, [decoded.userId]);

      if (!userResult || !userResult.rows || userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token - user not found'
        });
      }
    } catch (dbError) {
      console.error('Database query error in auth middleware:', dbError);
      return res.status(503).json({ success: false, message: 'Authentication service unavailable' });
    }

    // Attach user info to request
    req.user = userResult.rows[0];
    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional middleware to get user info if token is provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without user info
      req.user = null;
      req.userId = null;
      return next();
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user details from database
    try {
      const userQuery = 'SELECT id, email, name, created_at FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [decoded.userId]);

      if (userResult && userResult.rows && userResult.rows.length > 0) {
        req.user = userResult.rows[0];
        req.userId = decoded.userId;
      } else {
        req.user = null;
        req.userId = null;
      }
    } catch (dbError) {
      console.error('Database query error in optional auth:', dbError);
      req.user = null;
      req.userId = null;
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user info
    req.user = null;
    req.userId = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};