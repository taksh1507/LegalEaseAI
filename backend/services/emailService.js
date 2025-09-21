const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter only if email is configured
let transporter = null;

function initializeEmailTransporter() {
  if (validateEmailConfig()) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log('Email transporter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email transporter:', error.message);
    }
  } else {
    console.warn('Email credentials not configured. Email functionality will be disabled.');
  }
}

/**
 * Send OTP via email using Nodemailer
 * @param {string} to - Recipient email address
 * @param {string} otp - OTP code to send
 * @returns {Promise<Object>} Email response
 */
async function sendEmail(to, otp) {
  if (!transporter) {
    return {
      success: false,
      error: 'Email transporter not initialized. Please check your email credentials.'
    };
  }

  try {
    const mailOptions = {
      from: `"LegalEase AI" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Your Verification Code - LegalEase AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">LegalEase AI</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Verification Code</h3>
            <p style="color: #666; line-height: 1.6;">
              Use the following verification code to complete your authentication:
            </p>
            <div style="background-color: #fff; border: 2px solid #007bff; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 3px;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in <strong>5 minutes</strong>. Do not share this code with anyone.
            </p>
          </div>
          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            <p>If you didn't request this code, please ignore this email.</p>
            <p>&copy; 2025 LegalEase AI. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate email configuration
 * @returns {boolean} True if email is properly configured
 */
function validateEmailConfig() {
  const hasCredentials = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
  
  const hasValidCredentials = process.env.SMTP_USER !== 'your_email@gmail.com' &&
    process.env.SMTP_PASS !== 'your_app_password';
    
  return hasCredentials && hasValidCredentials;
}

/**
 * Test email connection
 * @returns {Promise<boolean>} True if connection is successful
 */
async function testEmailConnection() {
  if (!transporter) {
    console.error('Email transporter not initialized');
    return false;
  }
  
  try {
    await transporter.verify();
    console.log('Email server connection verified');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
}

// Initialize transporter when module is loaded
initializeEmailTransporter();

module.exports = {
  sendEmail,
  validateEmailConfig,
  testEmailConnection,
  initializeEmailTransporter
};