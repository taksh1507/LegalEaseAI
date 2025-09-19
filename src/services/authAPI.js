// API Configuration and utilities for LegalEaseAI Authentication
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class AuthAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Send OTP with enhanced parameters (supports both signin and signup)
  async sendOTP(data) {
    return this.makeRequest('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Verify OTP with enhanced parameters
  async verifyOTP(data) {
    return this.makeRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update user profile (requires authentication)
  async updateProfile(data) {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    return this.makeRequest('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  // Check server health
  async healthCheck() {
    return this.makeRequest('/health');
  }

  // Get server info
  async getServerInfo() {
    return this.makeRequest('/');
  }
}

// Create and export a singleton instance
const authAPI = new AuthAPI();

export default authAPI;

// Helper functions for token management
export const TokenManager = {
  setToken(token) {
    localStorage.setItem('authToken', token);
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  removeToken() {
    localStorage.removeItem('authToken');
  },

  isTokenValid() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT payload (basic check - for production use a proper JWT library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  getTokenPayload() {
    const token = this.getToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return null;
    }
  }
};