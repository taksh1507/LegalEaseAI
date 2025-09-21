// SMS Service disabled - Email only authentication
// const twilio = require('twilio');
require('dotenv').config();

/**
 * Send OTP via SMS using Twilio (DISABLED)
 * @param {string} to - Recipient mobile number
 * @param {string} otp - OTP code to send
 * @returns {Promise<Object>} Response indicating SMS is disabled
 */
async function sendSMS(to, otp) {
  return {
    success: false,
    error: 'SMS functionality is disabled. Please use email verification instead.',
    code: 'SMS_DISABLED'
  };
}

/**
 * Validate Twilio configuration (DISABLED)
 * @returns {boolean} Always returns false since SMS is disabled
 */
function validateTwilioConfig() {
  return false;
}

/**
 * Initialize Twilio client (DISABLED)
 */
function initializeTwilioClient() {
// SMS service disabled - using email verification only
}

// Initialize (no-op)
initializeTwilioClient();

module.exports = {
  sendSMS,
  validateTwilioConfig,
  initializeTwilioClient
};