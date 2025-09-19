const bcrypt = require('bcrypt');

/**
 * Password validation utilities
 */

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with success and message
 */
function validatePassword(password) {
  const minLength = 8;
  const maxLength = 128;
  
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters long` };
  }
  
  if (password.length > maxLength) {
    return { valid: false, message: `Password must not exceed ${maxLength} characters` };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' };
  }
  
  return { valid: true, message: 'Password is strong' };
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches hash
 */
async function comparePassword(password, hash) {
  // Check if both arguments are provided and valid
  if (!password || !hash) {
    return false;
  }
  
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

/**
 * Generate password strength score
 * @param {string} password - Password to score
 * @returns {Object} Score and feedback
 */
function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, feedback: 'Password is required' };
  }
  
  let score = 0;
  const feedback = [];
  
  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');
  
  if (password.length >= 12) score += 1;
  else if (password.length >= 8) feedback.push('Use 12+ characters for better security');
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push('Add special characters');
  
  // Additional complexity
  if (password.length >= 16) score += 1;
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) score += 1;
  
  let strength = 'Very Weak';
  if (score >= 7) strength = 'Very Strong';
  else if (score >= 5) strength = 'Strong';
  else if (score >= 3) strength = 'Medium';
  else if (score >= 2) strength = 'Weak';
  
  return {
    score,
    strength,
    feedback: feedback.length > 0 ? feedback : ['Password looks good!']
  };
}

module.exports = {
  validatePassword,
  hashPassword,
  comparePassword,
  getPasswordStrength
};