const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const { generateOTP, getOTPExpiration, isOTPExpired, isValidEmail } = require('../utils/otpUtils');
const { validatePassword, hashPassword, comparePassword } = require('../utils/passwordUtils');
const { sendEmail } = require('../services/emailService');

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

    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const userExists = userResult.rows.length > 0;

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
      
      // Check if user has a password hash (for users created before password system)
      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          message: 'Account created before password system. Please reset your password or contact support.'
        });
      }
      
      const passwordMatch = await comparePassword(password, user.password_hash);
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
        `INSERT INTO users (name, email, mobile_number, password_hash, email_verified) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, mobile_number, email_verified, mobile_verified, created_at`,
        [name, email, mobile_number || null, passwordHash, true]
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
      const passwordMatch = await comparePassword(current_password, currentUser.password_hash);
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
      updates.password_hash = newPasswordHash;
      setClause.push(`password_hash = $${paramCount}`);
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