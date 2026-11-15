const express = require('express');
const router = express.Router();
router.use((req, res, next) => {
  if (!pool)
    return res.status(503).json({ success: false, message: 'Authentication service unavailable' });
  if (['POST', 'PUT'].includes(req.method)) {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
      return res.status(400).json({ success: false, message: 'A JSON object is required' });
    for (const key of [
      'email',
      'password',
      'currentPassword',
      'newPassword',
      'current_password',
      'new_password',
      'phoneNumber',
      'name',
      'otp',
      'sessionId',
      'mobile_number',
      'mode',
      'action',
      'field',
      'newValue',
      'phone',
    ]) {
      const value = req.body[key];
      if (
        value !== undefined &&
        value !== null &&
        (typeof value !== 'string' ||
          value.length > (key.toLowerCase().includes('password') ? 72 : 255))
      )
        return res.status(400).json({ success: false, message: `Invalid ${key}` });
      if (
        key.toLowerCase().includes('password') &&
        typeof value === 'string' &&
        Buffer.byteLength(value) > 72
      )
        return res.status(400).json({ success: false, message: 'Password exceeds 72 bytes' });
    }
  }
  if (typeof req.body?.email === 'string') {
    if (!isValidEmail(req.body.email))
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    req.body.email = req.body.email.trim().toLowerCase();
  }
  if (req.body?.field === 'email' && typeof req.body.newValue === 'string')
    req.body.newValue = req.body.newValue.trim().toLowerCase();
  if (req.path.startsWith('/register-') && req.body?.password) {
    const validation = validatePassword(req.body.password);
    if (!validation.valid)
      return res.status(400).json({ success: false, message: validation.message });
  }
  for (const field of ['newPassword', 'new_password']) {
    if (req.body?.[field]) {
      const result = validatePassword(req.body[field]);
      if (!result.valid) return res.status(400).json({ success: false, message: result.message });
    }
  }
  if (req.body?.userData !== undefined) {
    const value = req.body.userData;
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      (value.name !== undefined && (typeof value.name !== 'string' || value.name.length > 255)) ||
      (value.email && (typeof value.email !== 'string' || !isValidEmail(value.email)))
    )
      return res.status(400).json({ success: false, message: 'Invalid signup details' });
    if (
      value.password !== undefined &&
      value.password !== null &&
      (typeof value.password !== 'string' ||
        Buffer.byteLength(value.password) > 72 ||
        !validatePassword(value.password).valid)
    )
      return res
        .status(400)
        .json({ success: false, message: 'A strong password of at most 72 bytes is required' });
  }
  if (req.body?.action && !['login', 'register'].includes(req.body.action))
    return res.status(400).json({ success: false, message: 'Invalid authentication action' });
  next();
});

const pool = require('../config/database');
const { isValidEmail } = require('../utils/otpUtils');
const { validatePassword, hashPassword, comparePassword } = require('../utils/passwordUtils');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Mobile OTP-based authentication routes
router.post('/send-mobile-otp', authController.sendOTP);
router.post('/verify-mobile-otp', authController.verifyOTP);

// Email/Password authentication routes
router.post('/register-email', authController.registerWithEmail);
router.post('/login-email', authController.loginWithEmail);

// Phone/Password authentication routes
router.post('/register-phone', authController.registerWithPhone);
router.post('/login-phone', authController.loginWithPhone);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

// Profile management routes
router.put('/update-profile', authMiddleware, authController.updateProfile);
router.post('/change-password', authMiddleware, authController.changePassword);
router.post('/send-email-otp-profile', authMiddleware, authController.sendEmailOTPForProfile);
router.post('/send-phone-otp-profile', authMiddleware, authController.sendPhoneOTPForProfile);
router.post('/verify-profile-change', authMiddleware, authController.verifyProfileChange);

const { sendChallenge, verifyChallenge } = require('../services/emailAuthService');

router.post('/send-otp', async (req, res, next) => {
  try {
    res.json(await sendChallenge(req.body));
  } catch (error) {
    next(error);
  }
});
router.post('/verify-otp', async (req, res, next) => {
  try {
    res.json(await verifyChallenge(req.body));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /profile
 * Update user profile
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Check if body exists and has data
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is empty or missing',
      });
    }

    const { name, email, mobile_number, current_password, new_password } = req.body;

    // Get current user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const currentUser = userResult.rows[0];
    if (
      (email !== undefined && email !== currentUser.email) ||
      (mobile_number !== undefined && mobile_number !== currentUser.mobile_number)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Contact changes require the verified profile-change flow.',
        });
    }
    const updates = {};
    const setClause = [];
    const values = [];
    let paramCount = 1;

    // Validate and prepare updates
    if (name && name !== currentUser.name) {
      updates.name = name;
      setClause.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email && email !== currentUser.email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }

      // Check if email is already taken
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [
        email,
        userId,
      ]);

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken',
        });
      }

      updates.email = email;
      updates.email_verified = false; // Reset verification when email changes
      setClause.push(`email = $${paramCount}`);
      setClause.push(`email_verified = $${paramCount + 1}`);
      values.push(email, false);
      paramCount += 2;
    }

    if (mobile_number !== undefined && mobile_number !== currentUser.mobile_number) {
      if (mobile_number && !/^\+?[\d\s\-\(\)]{10,15}$/.test(mobile_number)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid mobile number format',
        });
      }

      // Check if mobile is already taken (if provided)
      if (mobile_number) {
        const mobileCheck = await pool.query(
          'SELECT id FROM users WHERE mobile_number = $1 AND id != $2',
          [mobile_number, userId],
        );

        if (mobileCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Mobile number is already taken',
          });
        }
      }

      updates.mobile_number = mobile_number || null;
      updates.mobile_verified = false; // Reset verification when mobile changes
      setClause.push(`mobile_number = $${paramCount}`);
      setClause.push(`mobile_verified = $${paramCount + 1}`);
      values.push(mobile_number || null, false);
      paramCount += 2;
    }

    // Handle password change
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set new password',
        });
      }

      // Verify current password
      const passwordMatch = await comparePassword(current_password, currentUser.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Validate new password
      const passwordValidation = validatePassword(new_password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(new_password);
      updates.password = newPasswordHash;
      setClause.push(`password = $${paramCount}`);
      setClause.push('token_version = token_version + 1');
      values.push(newPasswordHash);
      paramCount++;
    }

    if (setClause.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes to update',
      });
    }

    // Add updated_at
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    // Execute update
    const updateQuery = `
      UPDATE users 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, email, mobile_number, email_verified, mobile_verified, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, values);
    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
      changes: Object.keys(updates),
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

module.exports = router;
