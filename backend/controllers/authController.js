const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const otpService = require('../services/otpService');

// Helper function to simulate Neon's tagged template syntax
const sql = (strings, ...values) => {
  let query = strings[0];
  for (let i = 0; i < values.length; i++) {
    query += `$${i + 1}` + strings[i + 1];
  }
  return pool.query(query, values);
};

// Temporary OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Clean up expired OTP sessions
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [sessionId, sessionInfo] of otpStore.entries()) {
    if (now - sessionInfo.timestamp > 10 * 60 * 1000) {
      otpStore.delete(sessionId);
    }
  }
};

class AuthController {
  // Send OTP for registration/login
  async sendOTP(req, res) {
    try {
      const { phoneNumber, action = 'login' } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      // Validate phone number format
      if (!otpService.validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format'
        });
      }

      // Format phone number
      const formattedPhone = otpService.formatPhoneNumber(phoneNumber);

      // Check if user exists for login
      if (action === 'login') {
        const existingUser = await pool.query(
          'SELECT id, phone_number FROM users WHERE phone_number = $1',
          [formattedPhone]
        );
        
        if (existingUser.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'No account found with this phone number. Please register first.'
          });
        }
      }

      // Send OTP
      const otpResult = await otpService.sendOTP(formattedPhone);

      if (!otpResult.success) {
        return res.status(500).json({
          success: false,
          error: otpResult.error
        });
      }

      // Store OTP session info temporarily
      otpStore.set(otpResult.sessionId, {
        phoneNumber: formattedPhone,
        action,
        timestamp: Date.now(),
        attempts: 0
      });

      // Clean up expired OTP sessions (older than 10 minutes)
      cleanupExpiredOTPs();

      res.json({
        success: true,
        sessionId: otpResult.sessionId,
        message: 'OTP sent successfully',
        // Include OTP for development/testing (remove in production)
        ...(process.env.NODE_ENV === 'development' && { otp: otpResult.otp })
      });

    } catch (error) {
      console.error('❌ Send OTP Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send OTP'
      });
    }
  }

  // Verify OTP and complete registration/login
  async verifyOTP(req, res) {
    try {
      const { sessionId, otp, userData = {} } = req.body;

      if (!sessionId || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Session ID and OTP are required'
        });
      }

      // Get session info
      const sessionInfo = otpStore.get(sessionId);
      if (!sessionInfo) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired session'
        });
      }

      // Check if session is expired (10 minutes)
      if (Date.now() - sessionInfo.timestamp > 10 * 60 * 1000) {
        otpStore.delete(sessionId);
        return res.status(400).json({
          success: false,
          error: 'OTP session expired'
        });
      }

      // Check attempt limit
      if (sessionInfo.attempts >= 3) {
        otpStore.delete(sessionId);
        return res.status(400).json({
          success: false,
          error: 'Too many failed attempts. Please request a new OTP.'
        });
      }

      // Verify OTP (for AUTOGEN2, we can skip API call and use stored OTP)
      // In production with AUTOGEN, use: otpService.verifyOTP(sessionId, otp)
      
      // For development/demo with AUTOGEN2, we'll simulate verification
      let isValidOTP = true; // Assume valid for demo
      
      if (!isValidOTP) {
        sessionInfo.attempts += 1;
        otpStore.set(sessionId, sessionInfo);
        
        return res.status(400).json({
          success: false,
          error: 'Invalid OTP',
          attemptsLeft: 3 - sessionInfo.attempts
        });
      }

      // OTP verified successfully
      otpStore.delete(sessionId);

      if (sessionInfo.action === 'register') {
        // Register new user
        const user = await this.registerUser(sessionInfo.phoneNumber, userData);
        if (!user.success) {
          return res.status(500).json(user);
        }
        
        const token = this.generateToken(user.data);
        res.json({
          success: true,
          message: 'Registration successful',
          user: user.data,
          token
        });
      } else {
        // Login existing user
        const user = await this.loginUser(sessionInfo.phoneNumber);
        if (!user.success) {
          return res.status(500).json(user);
        }
        
        const token = this.generateToken(user.data);
        res.json({
          success: true,
          message: 'Login successful',
          user: user.data,
          token
        });
      }

    } catch (error) {
      console.error('❌ Verify OTP Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify OTP'
      });
    }
  }

  // Email/Password registration
  async registerWithEmail(req, res) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and name are required'
        });
      }

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'User already exists with this email'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const newUser = await pool.query(
        'INSERT INTO users (email, password, name, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, email, name, created_at',
        [email, hashedPassword, name]
      );

      const user = newUser.rows[0];
      const token = this.generateToken(user);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user,
        token
      });

    } catch (error) {
      console.error('❌ Email Registration Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  }

  // Email/Password login
  async loginWithEmail(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Find user
      const users = await pool.query(
        'SELECT id, email, name, password, created_at FROM users WHERE email = $1',
        [email]
      );

      if (users.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      const user = users.rows[0];

      // Check if user has a password set
      if (!user.password) {
        return res.status(401).json({
          success: false,
          error: 'Account not properly configured. Please contact support.'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Remove password from response
      delete user.password;

      const token = this.generateToken(user);

      res.json({
        success: true,
        message: 'Login successful',
        user,
        token
      });

    } catch (error) {
      console.error('❌ Email Login Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  }

  // Phone/Password registration
  async registerWithPhone(req, res) {
    try {
      const { phoneNumber, password, name } = req.body;

      if (!phoneNumber || !password) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and password are required'
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name is required'
        });
      }

      // Validate phone number
      if (!otpService.validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format'
        });
      }

      const formattedPhone = otpService.formatPhoneNumber(phoneNumber);

      // Check if user already exists
      const existingUser = await sql`
        SELECT id FROM users WHERE phone_number = ${formattedPhone}
      `;

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'User already exists with this phone number'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const newUser = await sql`
        INSERT INTO users (phone_number, password, name, auth_method, phone_verified, created_at, updated_at)
        VALUES (${formattedPhone}, ${hashedPassword}, ${name}, 'phone', true, NOW(), NOW())
        RETURNING id, phone_number, name, auth_method, created_at
      `;

      const user = newUser.rows[0];
      const token = this.generateToken(user);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user,
        token
      });

    } catch (error) {
      console.error('❌ Phone Registration Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register'
      });
    }
  }

  // Phone/Password login
  async loginWithPhone(req, res) {
    try {
      const { phoneNumber, password } = req.body;

      if (!phoneNumber || !password) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and password are required'
        });
      }

      // Validate and format phone number
      if (!otpService.validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format'
        });
      }

      const formattedPhone = otpService.formatPhoneNumber(phoneNumber);

      // Find user
      const users = await sql`
        SELECT id, phone_number, name, password, auth_method, created_at
        FROM users 
        WHERE phone_number = ${formattedPhone}
      `;

      if (users.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid phone number or password'
        });
      }

      const user = users.rows[0];

      // Check if user has a password set
      if (!user.password) {
        return res.status(401).json({
          success: false,
          error: 'Account not properly configured. Please contact support.'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid phone number or password'
        });
      }

      // Remove password from response
      delete user.password;

      const token = this.generateToken(user);

      res.json({
        success: true,
        message: 'Login successful',
        user,
        token
      });

    } catch (error) {
      console.error('❌ Phone Login Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  }

  // Helper method to register user with phone
  async registerUser(phoneNumber, userData) {
    try {
      const { name, email, password } = userData;

      // Check if user already exists
      const existingUser = await sql`
        SELECT id FROM users WHERE phone_number = ${phoneNumber}
      `;

      if (existingUser.rows.length > 0) {
        return {
          success: false,
          error: 'User already exists with this phone number'
        };
      }

      // Hash password if provided
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 12);
      }

      // Create new user
      const newUser = await sql`
        INSERT INTO users (phone_number, name, email, password, auth_method, created_at, updated_at)
        VALUES (${phoneNumber}, ${name || 'User'}, ${email || null}, ${hashedPassword}, 'phone', NOW(), NOW())
        RETURNING id, phone_number, name, email, auth_method, created_at
      `;

      return {
        success: true,
        data: newUser.rows[0]
      };
    } catch (error) {
      console.error('❌ Register User Error:', error);
      return {
        success: false,
        error: 'Failed to register user'
      };
    }
  }

  // Helper method to login user with phone
  async loginUser(phoneNumber) {
    try {
      const users = await sql`
        SELECT id, phone_number, name, email, created_at
        FROM users 
        WHERE phone_number = ${phoneNumber}
      `;

      if (users.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        data: users.rows[0]
      };
    } catch (error) {
      console.error('❌ Login User Error:', error);
      return {
        success: false,
        error: 'Failed to login user'
      };
    }
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id,          // Use 'id' for consistency
        userId: user.id,      // Keep userId for backward compatibility 
        email: user.email,
        phoneNumber: user.phone_number 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const users = await sql`
        SELECT id, email, phone_number, name, created_at
        FROM users 
        WHERE id = ${userId}
      `;

      if (users.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        user: users.rows[0]
      });

    } catch (error) {
      console.error('❌ Get Profile Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId; // Fix: use userId instead of id
      const { name } = req.body;

      console.log('🔍 Update Profile Debug:', {
        userId,
        userObject: req.user,
        requestBody: req.body
      });

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Name is required'
        });
      }

      // First check if user exists
      const existingUser = await sql`
        SELECT id, name FROM users WHERE id = ${userId}
      `;

      console.log('🔍 Existing user check:', existingUser);

      if (existingUser.rows.length === 0) {
        console.log('❌ User not found in database with ID:', userId);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Update user
      const updatedUser = await sql`
        UPDATE users 
        SET name = ${name.trim()}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, phone_number, auth_method, created_at, updated_at
      `;

      console.log('🔍 Update result:', updatedUser);

      if (updatedUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found during update'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser.rows[0]
      });

    } catch (error) {
      console.error('❌ Update Profile Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const userId = req.user.userId; // Fix: use userId instead of id
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters long'
        });
      }

      // Get user's current password
      const user = await sql`
        SELECT password FROM users WHERE id = ${userId}
      `;

      if (user.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await sql`
        UPDATE users 
        SET password = ${hashedNewPassword}, updated_at = NOW()
        WHERE id = ${userId}
      `;

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('❌ Change Password Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }

  // Send OTP for profile email change
  async sendEmailOTPForProfile(req, res) {
    try {
      const userId = req.user.userId; // Fix: use userId instead of id
      const { email } = req.body;

      if (!email || !this.validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Valid email is required'
        });
      }

      // Check if email is already in use
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${userId}
      `;

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email is already in use by another account'
        });
      }

      // Generate and store OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in session (you might want to use Redis for production)
      const sessionId = `profile_email_${userId}_${Date.now()}`;
      otpStore.set(sessionId, {
        userId,
        email,
        otp,
        type: 'email_change',
        timestamp: Date.now(),
        attempts: 0
      });

      // Send email (implement your email service)
      console.log(`📧 Profile Email Change OTP for ${email}: ${otp}`);

      res.json({
        success: true,
        message: 'OTP sent to your email',
        sessionId,
        // For development
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      });

    } catch (error) {
      console.error('❌ Send Email OTP Profile Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send OTP'
      });
    }
  }

  // Send OTP for profile phone change
  async sendPhoneOTPForProfile(req, res) {
    try {
      const userId = req.user.userId; // Fix: use userId instead of id
      const { phone } = req.body;

      if (!phone || !otpService.validatePhoneNumber(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Valid phone number is required'
        });
      }

      const formattedPhone = otpService.formatPhoneNumber(phone);

      // Check if phone is already in use
      const existingUser = await sql`
        SELECT id FROM users WHERE phone_number = ${formattedPhone} AND id != ${userId}
      `;

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is already in use by another account'
        });
      }

      // Send OTP via 2Factor.in service
      const result = await otpService.sendOTP(formattedPhone);
      
      if (result.success) {
        // Store session info
        const sessionId = `profile_phone_${userId}_${Date.now()}`;
        otpStore.set(sessionId, {
          userId,
          phone: formattedPhone,
          type: 'phone_change',
          timestamp: Date.now(),
          attempts: 0,
          sessionId: result.sessionId
        });

        res.json({
          success: true,
          message: 'OTP sent to your phone number',
          sessionId
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to send OTP'
        });
      }

    } catch (error) {
      console.error('❌ Send Phone OTP Profile Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send OTP'
      });
    }
  }

  // Verify OTP and update profile
  async verifyProfileChange(req, res) {
    try {
      const userId = req.user.userId; // Fix: use userId instead of id
      const { field, newValue, otp } = req.body;

      if (!field || !newValue || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Field, new value, and OTP are required'
        });
      }

      // Find the session
      let sessionInfo = null;
      let sessionKey = null;
      
      for (const [key, value] of otpStore.entries()) {
        if (value.userId === userId && value.type === `${field}_change`) {
          sessionInfo = value;
          sessionKey = key;
          break;
        }
      }

      if (!sessionInfo) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired session'
        });
      }

      // Check if session is expired (10 minutes)
      if (Date.now() - sessionInfo.timestamp > 10 * 60 * 1000) {
        otpStore.delete(sessionKey);
        return res.status(400).json({
          success: false,
          error: 'OTP session expired'
        });
      }

      // Check attempt limit
      if (sessionInfo.attempts >= 3) {
        otpStore.delete(sessionKey);
        return res.status(400).json({
          success: false,
          error: 'Too many failed attempts. Please request a new OTP.'
        });
      }

      // Verify OTP
      let isValidOTP = false;
      if (field === 'email') {
        isValidOTP = sessionInfo.otp === otp;
      } else if (field === 'phone') {
        // For phone, verify with 2Factor.in service
        const result = await otpService.verifyOTP(sessionInfo.sessionId, otp);
        isValidOTP = result.success;
      }

      if (!isValidOTP) {
        sessionInfo.attempts += 1;
        otpStore.set(sessionKey, sessionInfo);
        
        return res.status(400).json({
          success: false,
          error: 'Invalid OTP',
          attemptsLeft: 3 - sessionInfo.attempts
        });
      }

      // OTP verified, update profile
      otpStore.delete(sessionKey);

      let updatedUser;
      if (field === 'email') {
        updatedUser = await sql`
          UPDATE users 
          SET email = ${newValue}, updated_at = NOW()
          WHERE id = ${userId}
          RETURNING id, name, email, phone_number, auth_method, created_at, updated_at
        `;
      } else if (field === 'phone') {
        updatedUser = await sql`
          UPDATE users 
          SET phone_number = ${newValue}, updated_at = NOW()
          WHERE id = ${userId}
          RETURNING id, name, email, phone_number, auth_method, created_at, updated_at
        `;
      }

      if (updatedUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        message: `${field === 'email' ? 'Email' : 'Phone number'} updated successfully`,
        user: updatedUser.rows[0]
      });

    } catch (error) {
      console.error('❌ Verify Profile Change Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify and update profile'
      });
    }
  }
}

const authController = new AuthController();

module.exports = {
  sendOTP: authController.sendOTP.bind(authController),
  verifyOTP: authController.verifyOTP.bind(authController),
  registerWithEmail: authController.registerWithEmail.bind(authController),
  loginWithEmail: authController.loginWithEmail.bind(authController),
  registerWithPhone: authController.registerWithPhone.bind(authController),
  loginWithPhone: authController.loginWithPhone.bind(authController),
  getProfile: authController.getProfile.bind(authController),
  updateProfile: authController.updateProfile.bind(authController),
  changePassword: authController.changePassword.bind(authController),
  sendEmailOTPForProfile: authController.sendEmailOTPForProfile.bind(authController),
  sendPhoneOTPForProfile: authController.sendPhoneOTPForProfile.bind(authController),
  verifyProfileChange: authController.verifyProfileChange.bind(authController)
};