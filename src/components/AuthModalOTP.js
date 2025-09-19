import React, { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import authAPI, { TokenManager } from '../services/authAPI';

const AuthModal = ({ isOpen, onClose, onAuthSuccess, mode: initialMode = 'signin' }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile_number: '',
    password: '',
    otp: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile_number: '',
      password: '',
      otp: ''
    });
    setStep('form');
    setShowSuccessMessage(false);
    setError('');
    setPasswordStrength(null);
  };

  // Sync internal mode state with prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const validatePassword = (password) => {
    if (!password) return null;
    
    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');
    
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Add numbers');
    
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;
    else feedback.push('Add special characters');
    
    let strength = 'Very Weak';
    let color = 'red';
    if (score >= 6) { strength = 'Very Strong'; color = 'green'; }
    else if (score >= 4) { strength = 'Strong'; color = 'blue'; }
    else if (score >= 3) { strength = 'Medium'; color = 'yellow'; }
    else if (score >= 2) { strength = 'Weak'; color = 'orange'; }
    
    return { score, strength, color, feedback };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time password strength checking for signup
    if (name === 'password' && mode === 'signup') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && !formData.name.trim()) {
      setError('Name is required for signup');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.sendOTP({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        mobile_number: formData.mobile_number,
        mode
      });
      
      if (response.success) {
        setStep('otp');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP({
        email: formData.email,
        otp: formData.otp,
        name: formData.name,
        password: formData.password,
        mobile_number: formData.mobile_number,
        mode
      });
      
      if (response.success) {
        // Store the JWT token
        TokenManager.setToken(response.token);
        
        // Create user object for the parent component
        const user = {
          id: response.user.id,
          name: response.user.name || response.user.email.split('@')[0],
          email: response.user.email,
          mobile_number: response.user.mobile_number,
          profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.name || response.user.email.split('@')[0])}&background=3b82f6&color=ffffff`
        };
        
        setShowSuccessMessage(true);
        
        setTimeout(() => {
          onAuthSuccess(user);
          resetForm();
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Invalid OTP');
      }
    } catch (error) {
      setError(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setPasswordStrength(null);
    if (step === 'otp') {
      setStep('form');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'form' 
              ? (mode === 'signup' ? 'Create Account' : 'Sign In')
              : 'Verify OTP'
            }
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'form' 
              ? (mode === 'signup' ? 'Join LegalEase AI today' : 'Welcome back to LegalEase AI')
              : `Enter the OTP sent to ${formData.email}`
            }
          </p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {step === 'otp' ? 'Authentication successful!' : 'OTP sent successfully!'}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        {step === 'form' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            {/* Name Field (Signup Only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your full name"
                  required={mode === 'signup'}
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Mobile Number (Signup Only - Optional) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator (Signup Only) */}
              {mode === 'signup' && passwordStrength && formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength.score / 6) * 100}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium" style={{ color: passwordStrength.color }}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {passwordStrength.feedback.slice(0, 3).map((tip, index) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Sending OTP...' : `Send OTP ${mode === 'signup' ? '& Create Account' : '& Sign In'}`}
            </button>

            {/* Mode Switch */}
            <div className="text-center">
              <button
                type="button"
                onClick={switchMode}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                {mode === 'signup' 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        ) : (
          /* OTP Verification Form */
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center text-lg tracking-wider"
                placeholder="000000"
                maxLength="6"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full text-gray-600 dark:text-gray-400 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Back to {mode === 'signup' ? 'Signup' : 'Signin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;