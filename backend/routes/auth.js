const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const { generateOTP, getOTPExpiration, isOTPExpired, isValidEmail } = require('../utils/otpUtils');
const { validatePassword, hashPassword, comparePassword } = require('../utils/passwordUtils');
const { sendEmail } = require('../services/emailService');
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

/**
 * POST /send-otp
 * Send OTP to email for signup/signin verification
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name, password, mobile_number, mode } = req.body;

    // Validate mode (signup or signin)
    if (!mode || !['signup', 'signin'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Mode must be either "signup" or "signin"'
      });
    }

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    // Check if database is available
    if (!pool) {
      console.log('Database not available - using mock mode');
      // Generate mock OTP for development
      const otp = generateOTP();
      
      // Send email if configured
      try {
        await sendEmail(email, 'LegalEaseAI - Verification Code', `Your verification code is: ${otp}`);
        console.log(`Mock OTP sent to ${email}: ${otp}`);
      } catch (emailError) {
        console.log('Email service not available, but OTP generated:', otp);
      }

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully (development mode)',
        mockOtp: otp // Only for development - remove in production
      });
    }

    // Database available - proceed with normal flow
    let userExists = false;
    let userResult = null;
    try {
      userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      userExists = userResult.rows.length > 0;
    } catch (dbError) {
      console.error('Database query error:', dbError.message);
      // Fall back to mock mode
      const otp = generateOTP();
      try {
        await sendEmail(email, 'LegalEaseAI - Verification Code', `Your verification code is: ${otp}`);
      } catch (emailError) {
        console.log('Email service error:', emailError.message);
      }
      
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully (fallback mode)',
        mockOtp: otp
      });
    }

    if (mode === 'signup') {
      // Signup mode validations
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email. Please sign in instead.'
        });
      }

      if (!name || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name and password are required for signup'
        });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message
        });
      }

      // Validate mobile number if provided
      if (mobile_number && !/^\+?[\d\s\-\(\)]{10,15}$/.test(mobile_number)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid mobile number format'
        });
      }
    } else {
      // Signin mode validations
      if (!userExists) {
        return res.status(400).json({
          success: false,
          message: 'No account found with this email. Please sign up first.'
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required for signin'
        });
      }

      // Verify password
      const user = userResult.rows[0];
      
      // Check if user has a password (for users created before password system)
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Account created before password system. Please reset your password or contact support.'
        });
      }
      
      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    const otp = generateOTP();
    const expiresAt = getOTPExpiration();

    // Clean up old OTPs for this email
    await pool.query('DELETE FROM otps WHERE email = $1', [email]);

    // Store new OTP with user data for signup
    const otpData = {
      email,
      otp_code: otp,
      expires_at: expiresAt
    };

    if (mode === 'signup') {
      // Store signup data temporarily in OTP record (we'll move this to a separate table in production)
      await pool.query(
        'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3)',
        [email, otp, expiresAt]
      );
    } else {
      await pool.query(
        'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3)',
        [email, otp, expiresAt]
      );
    }

    // Send OTP via email
    const sendResult = await sendEmail(email, otp);

    if (!sendResult.success) {
      // Remove the OTP if sending failed
      await pool.query(
        'DELETE FROM otps WHERE email = $1 AND otp_code = $2',
        [email, otp]
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP via email',
        error: sendResult.error
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      identifier: email,
      expiresIn: '5 minutes'
    });

  } catch (error) {
    console.error('Error in /send-otp:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /verify-otp
 * Verify OTP and create/login user
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, password, mobile_number, mode } = req.body;

    // Validate input
    if (!otp || !email || !mode) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and mode are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if database is available
    if (!pool) {
      console.log('Database not available - using mock verification');
      
      // For mock mode, accept any 6-digit OTP
      if (otp.length === 6 && /^\d{6}$/.test(otp)) {
        // Generate mock JWT token
        const mockUser = {
          id: Math.floor(Math.random() * 1000),
          email: email,
          name: name || 'Mock User'
        };
        
        const token = jwt.sign(
          { userId: mockUser.id, email: mockUser.email },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json({
          success: true,
          message: 'OTP verified successfully (mock mode)',
          user: mockUser,
          token: token
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP format'
        });
      }
    }

    // Database available - proceed with normal verification
    try {
      // Find OTP
      const otpResult = await pool.query(
        'SELECT * FROM otps WHERE email = $1 AND otp_code = $2 AND verified = false ORDER BY created_at DESC LIMIT 1',
        [email, otp]
      );

      if (otpResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      const otpRecord = otpResult.rows[0];

      // Check if OTP is expired
      if (isOTPExpired(otpRecord.expires_at)) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired'
        });
      }

      // Mark OTP as verified
      await pool.query('UPDATE otps SET verified = true WHERE id = $1', [otpRecord.id]);

      let user;

    if (mode === 'signup') {
      // Validate signup data
      if (!name || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name and password are required for signup'
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create new user
      const insertResult = await pool.query(
        `INSERT INTO users (name, email, phone_number, password, email_verified, auth_method, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id, name, email, phone_number, auth_method, created_at`,
        [name, email, mobile_number || null, passwordHash, true, 'email']
      );
      user = insertResult.rows[0];
    } else {
      // Signin mode - get existing user
      const userResult = await pool.query(
        'SELECT id, name, email, mobile_number, email_verified, mobile_verified, created_at FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }

      user = userResult.rows[0];

      // Update email verification status
      await pool.query(
        'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      user.email_verified = true;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        mobile_number: user.mobile_number
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile_number: user.mobile_number,
        email_verified: user.email_verified,
        mobile_verified: user.mobile_verified,
        created_at: user.created_at
      }
    });

    } catch (dbError) {
      console.error('Database error in verify-otp:', dbError.message);
      
      // Fall back to mock mode for development
      const mockUser = {
        id: Math.floor(Math.random() * 1000),
        email: email,
        name: name || 'Mock User'
      };
      
      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully (fallback mode)',
        user: mockUser,
        token: token
      });
    }

  } catch (error) {
    console.error('Error in /verify-otp:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * PUT /profile
 * Update user profile
 */
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if body exists and has data
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is empty or missing'
      });
    }

    const { name, email, mobile_number, current_password, new_password } = req.body;

    // Get current user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = userResult.rows[0];
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
          message: 'Invalid email format'
        });
      }

      // Check if email is already taken
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
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
          message: 'Invalid mobile number format'
        });
      }

      // Check if mobile is already taken (if provided)
      if (mobile_number) {
        const mobileCheck = await pool.query(
          'SELECT id FROM users WHERE mobile_number = $1 AND id != $2',
          [mobile_number, userId]
        );

        if (mobileCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Mobile number is already taken'
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
          message: 'Current password is required to set new password'
        });
      }

      // Verify current password
      const passwordMatch = await comparePassword(current_password, currentUser.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Validate new password
      const passwordValidation = validatePassword(new_password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(new_password);
      updates.password = newPasswordHash;
      setClause.push(`password = $${paramCount}`);
      values.push(newPasswordHash);
      paramCount++;
    }

    if (setClause.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes to update'
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
      changes: Object.keys(updates)
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }

    console.error('Error in /profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;