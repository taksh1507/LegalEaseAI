const express = require('express');
const pool = require('../config/database');
const { generateOTP, getOTPExpiration, isValidEmail, isValidMobile } = require('../utils/otpUtils');
const { sendSMS } = require('../services/smsService');
const { sendEmail } = require('../services/emailService');

const router = express.Router();

/**
 * POST /api/auth/send-otp
 * Send OTP to mobile number or email
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { mobile_number, email } = req.body;

    // Validate input - either mobile or email must be provided
    if (!mobile_number && !email) {
      return res.status(400).json({
        success: false,
        message: 'Either mobile_number or email must be provided'
      });
    }

    // Validate both are not provided
    if (mobile_number && email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either mobile_number or email, not both'
      });
    }

    let userIdentifier;
    let contactMethod;

    // Validate and set identifier
    if (mobile_number) {
      if (!isValidMobile(mobile_number)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid mobile number format'
        });
      }
      userIdentifier = mobile_number;
      contactMethod = 'mobile';
    } else {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
      userIdentifier = email;
      contactMethod = 'email';
    }

    // Generate OTP and expiration
    const otpCode = generateOTP();
    const expiresAt = getOTPExpiration();

    // Store OTP in database
    const insertOtpQuery = `
      INSERT INTO otps (user_identifier, otp_code, expires_at) 
      VALUES ($1, $2, $3) 
      RETURNING id
    `;
    
    const otpResult = await pool.query(insertOtpQuery, [userIdentifier, otpCode, expiresAt]);

    if (!otpResult.rows[0]) {
      throw new Error('Failed to store OTP in database');
    }

    // Send OTP based on contact method
    let sendResult;
    if (contactMethod === 'mobile') {
      sendResult = await sendSMS(userIdentifier, otpCode);
    } else {
      sendResult = await sendEmail(userIdentifier, otpCode);
    }

    if (!sendResult.success) {
      // If sending fails, we might want to delete the OTP from database
      await pool.query('DELETE FROM otps WHERE id = $1', [otpResult.rows[0].id]);
      
      return res.status(500).json({
        success: false,
        message: `Failed to send OTP via ${contactMethod}`,
        error: sendResult.error
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: `OTP sent successfully to your ${contactMethod}`,
      data: {
        identifier: userIdentifier,
        method: contactMethod,
        expiresIn: '5 minutes'
      }
    });

  } catch (error) {
    console.error('Error in send-otp endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;