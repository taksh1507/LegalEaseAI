const axios = require('axios');

class OTPService {
  constructor() {
    this.API_KEY = '856e4dac-9653-11f0-a562-0200cd936042'; // Your 2Factor.in API key
    this.BASE_URL = 'https://2factor.in/API/V1';
  }

  /**
   * Send OTP to mobile number
   * @param {string} phoneNumber - Phone number with country code (e.g., +919920792819)
   * @param {string} template - OTP template name (default: 'OTP1')
   * @returns {Promise} Response with session ID and OTP
   */
  async sendOTP(phoneNumber, template = 'OTP1') {
    try {
      // Clean phone number - ensure it starts with +
      const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const url = `${this.BASE_URL}/${this.API_KEY}/SMS/${cleanPhone}/AUTOGEN2/${template}`;
      
      console.log('🚀 Sending OTP to:', cleanPhone);
      
      const response = await axios.get(url);
      
      if (response.data.Status === 'Success') {
        console.log('✅ OTP sent successfully:', {
          sessionId: response.data.Details,
          // Don't log actual OTP in production
          otpSent: true
        });
        
        return {
          success: true,
          sessionId: response.data.Details,
          otp: response.data.OTP, // Only for AUTOGEN2, remove in production
          message: 'OTP sent successfully'
        };
      } else {
        console.error('❌ Failed to send OTP:', response.data);
        return {
          success: false,
          error: response.data.Details || 'Failed to send OTP'
        };
      }
    } catch (error) {
      console.error('❌ OTP Service Error:', error.message);
      return {
        success: false,
        error: 'Network error while sending OTP'
      };
    }
  }

  /**
   * Verify OTP (use this if not using AUTOGEN2)
   * @param {string} sessionId - Session ID from send OTP response
   * @param {string} enteredOTP - OTP entered by user
   * @returns {Promise} Verification result
   */
  async verifyOTP(sessionId, enteredOTP) {
    try {
      const url = `${this.BASE_URL}/${this.API_KEY}/SMS/VERIFY/${sessionId}/${enteredOTP}`;
      
      console.log('🔍 Verifying OTP for session:', sessionId);
      
      const response = await axios.get(url);
      
      if (response.data.Status === 'Success') {
        console.log('✅ OTP verified successfully');
        return {
          success: true,
          message: 'OTP verified successfully'
        };
      } else {
        console.log('❌ OTP verification failed:', response.data.Details);
        return {
          success: false,
          error: response.data.Details || 'Invalid OTP'
        };
      }
    } catch (error) {
      console.error('❌ OTP Verification Error:', error.message);
      return {
        success: false,
        error: 'Network error during OTP verification'
      };
    }
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} Is valid phone number
   */
  validatePhoneNumber(phoneNumber) {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  }

  /**
   * Format phone number for API
   * @param {string} phoneNumber - Raw phone number
   * @param {string} countryCode - Default country code (e.g., '+91')
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber, countryCode = '+91') {
    // Remove all spaces and special characters
    let clean = phoneNumber.replace(/[^\d]/g, '');
    
    // If number doesn't start with country code, add it
    if (!phoneNumber.startsWith('+')) {
      // If it starts with 0, remove it (common in many countries)
      if (clean.startsWith('0')) {
        clean = clean.substring(1);
      }
      clean = countryCode + clean;
    }
    
    return clean;
  }
}

module.exports = new OTPService();