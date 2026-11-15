const crypto = require('crypto');

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Get expiration time for OTP (5 minutes from now)
 * @returns {Date} Expiration timestamp
 */
function getOTPExpiration() {
  const now = new Date();
  return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
}

/**
 * Check if OTP is expired
 * @param {Date} expiresAt - Expiration timestamp
 * @returns {boolean} True if expired
 */
function isOTPExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
  if (typeof email !== 'string' || email.length > 255 || /\s/.test(email)) return false;
  const separator = email.indexOf('@');
  if (separator <= 0 || separator !== email.lastIndexOf('@')) return false;
  const domain = email.slice(separator + 1);
  const dot = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1;
}

/**
 * Validate mobile number format (basic validation)
 * @param {string} mobile - Mobile number to validate
 * @returns {boolean} True if valid mobile
 */
function isValidMobile(mobile) {
  // Basic validation for international mobile numbers
  const mobileRegex = /^\+?[1-9]\d{1,14}$/;
  return mobileRegex.test(mobile);
}

module.exports = {
  generateOTP,
  getOTPExpiration,
  isOTPExpired,
  isValidEmail,
  isValidMobile,
};
