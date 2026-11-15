const axios = require('axios');

class OTPService {
  validatePhoneNumber(phone) {
    return typeof phone === 'string' && /^\+?[1-9]\d{9,14}$/.test(phone.replace(/[\s()-]/g, ''));
  }

  formatPhoneNumber(phone, countryCode = process.env.DEFAULT_COUNTRY_CODE || '+91') {
    const digits = phone.replace(/\D/g, '');
    return phone.trim().startsWith('+') ? '+' + digits : countryCode + digits.replace(/^0/, '');
  }

  async request(parts) {
    const key = process.env.TWOFACTOR_API_KEY;
    if (!key)
      return { success: false, unavailable: true, error: 'SMS verification is not configured' };
    try {
      const url =
        'https://2factor.in/API/V1/' + [key, 'SMS', ...parts].map(encodeURIComponent).join('/');
      const response = await axios.get(url, { timeout: 15000, maxRedirects: 0 });
      if (response.data.Status !== 'Success')
        return { success: false, error: 'SMS verification failed' };
      return { success: true, sessionId: response.data.Details };
    } catch {
      return { success: false, unavailable: true, error: 'SMS verification service unavailable' };
    }
  }

  sendOTP(phone, template = process.env.TWOFACTOR_TEMPLATE || 'OTP1') {
    return this.request([phone, 'AUTOGEN', template]);
  }

  verifyOTP(sessionId, code) {
    if (typeof code !== 'string' || !/^\d{6}$/.test(code) || typeof sessionId !== 'string')
      return Promise.resolve({ success: false });
    return this.request(['VERIFY', sessionId, code]);
  }
}
module.exports = new OTPService();
