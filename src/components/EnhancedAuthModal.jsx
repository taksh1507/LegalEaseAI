import useDialog from '../hooks/useDialog';
import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const EnhancedAuthModal = ({ isOpen, onClose, mode = 'signin', onAuthSuccess }) => {
  const [currentMode, setCurrentMode] = useState(mode === 'signup' ? 'signup' : 'signin'); // Local state for mode
  const [currentStep, setCurrentStep] = useState('credentials'); // 'credentials' or 'otp'
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or phone
    password: '',
    name: '', // Only for signup
    otp: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const dialogRef = useDialog(isOpen, onClose);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSession, setOtpSession] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Reset mode when prop changes
  useEffect(() => {
    setCurrentMode(mode === 'signup' ? 'signup' : 'signin');
    setCurrentStep('credentials');
    setFormData({ identifier: '', password: '', name: '', otp: '' });
    setError('');
    setSuccess('');
    setCountdown(0);
    setOtpSession(null);
  }, [mode, isOpen]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({ identifier: '', password: '', name: '', otp: '' });
    setCurrentStep('credentials');
    setError('');
    setSuccess('');
    setOtpSession(null);
    setCountdown(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    // Basic international phone validation (accepts + and digits)
    return /^\+?[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ''));
  };

  const detectInputType = (input) => {
    if (validateEmail(input)) return 'email';
    if (validatePhone(input)) return 'phone';
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // If we're in OTP step, verify OTP
    if (currentStep === 'otp') {
      return handleVerifyOTP();
    }

    // Validate input
    if (!formData.identifier || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (currentMode === 'signup' && !formData.name) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }

    // Detect input type
    const inputType = detectInputType(formData.identifier);
    if (!inputType) {
      setError('Please enter a valid email address or phone number');
      setLoading(false);
      return;
    }

    try {
      if (currentMode === 'signin') {
        // For signin, use direct password authentication (no OTP)
        let endpoint, payload;

        if (inputType === 'email') {
          endpoint = '/api/auth/login-email';
          payload = { email: formData.identifier, password: formData.password };
        } else {
          endpoint = '/api/auth/login-phone';
          payload = { phoneNumber: formData.identifier, password: formData.password };
        }

        const apiUrl = API_BASE_URL;
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess(data.message);
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          onAuthSuccess(data.user, data.token);
          handleClose();
        } else {
          setError(data.message || data.error || 'Authentication failed');
        }
      } else {
        // For signup, send OTP first
        await handleSendOTP();
      }
    } catch (error) {
      console.error('Auth Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for signup
  const handleSendOTP = async () => {
    const inputType = detectInputType(formData.identifier);

    try {
      let endpoint, payload;

      if (inputType === 'email') {
        // Send email OTP
        endpoint = '/api/auth/send-otp';
        payload = {
          email: formData.identifier,
          name: formData.name,
          password: formData.password,
          mode: 'signup',
        };
      } else {
        // Send mobile OTP
        endpoint = '/api/auth/send-mobile-otp';
        payload = {
          phoneNumber: formData.identifier,
          action: 'register',
        };
      }

      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSession(data.sessionId);
        setCurrentStep('otp');
        setCountdown(300); // 5 minutes
        setSuccess(`OTP sent to your ${inputType}`);
      } else {
        setError(data.message || data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP Error:', error);
      setError('Network error. Please try again.');
    }
  };

  // Verify OTP for signup
  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    const inputType = detectInputType(formData.identifier);

    try {
      let endpoint, payload;

      if (inputType === 'email') {
        // Verify email OTP
        endpoint = '/api/auth/verify-otp';
        payload = {
          email: formData.identifier,
          otp: formData.otp,
          name: formData.name,
          password: formData.password,
          mode: 'signup',
        };
      } else {
        // Verify mobile OTP
        endpoint = '/api/auth/verify-mobile-otp';
        payload = {
          sessionId: otpSession,
          otp: formData.otp,
          userData: {
            name: formData.name,
            email: null,
            password: formData.password,
          },
        };
      }

      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess(data.user, data.token);
        handleClose();
      } else {
        setError(data.message || data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInputPlaceholder = () => {
    return 'Enter email or phone number';
  };

  const getInputType = () => {
    const inputType = detectInputType(formData.identifier);
    if (inputType === 'email') return '📧 Email detected';
    if (inputType === 'phone') return '📱 Phone detected';
    return '';
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentMode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close authentication dialog"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'credentials' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field for signup */}
              {currentMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="auth-name"
                    name="name"
                    autoComplete="name"
                    aria-label="Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your full name"
                    required={currentMode === 'signup'}
                  />
                </div>
              )}

              {/* Email or Phone field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="auth-identifier"
                    name="identifier"
                    autoComplete="username"
                    aria-label="Email or Phone Number"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-20"
                    placeholder={getInputPlaceholder()}
                    required
                  />
                  {formData.identifier && (
                    <div className="absolute right-3 top-2.5 text-xs text-gray-500">
                      {getInputType()}
                    </div>
                  )}
                </div>
                {formData.identifier && (
                  <p className="text-xs text-gray-500 mt-1">
                    {detectInputType(formData.identifier) === 'phone' &&
                      'Phone authentication with password'}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="auth-password"
                    name="password"
                    autoComplete={currentMode === 'signin' ? 'current-password' : 'new-password'}
                    aria-label="Password"
                    maxLength={72}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? 'Processing...'
                  : currentMode === 'signin'
                    ? 'Sign In'
                    : currentMode === 'signup'
                      ? 'Send OTP'
                      : 'Continue'}
              </button>
            </form>
          )}

          {currentStep === 'otp' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Verify OTP</h3>
                <p className="text-sm text-gray-600">Enter the verification code sent to</p>
                <p className="font-medium text-gray-900">{formData.identifier}</p>
                {countdown > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Resend in {Math.floor(countdown / 60)}:
                    {(countdown % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                  <input
                    type="text"
                    name="otp"
                    autoComplete="one-time-code"
                    aria-label="Verification code"
                    value={formData.otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setFormData((prev) => ({ ...prev, otp: value }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !formData.otp || formData.otp.length !== 6}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('credentials');
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Back to credentials
                </button>

                {countdown === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSendOTP();
                    }}
                    className="w-full text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    Resend OTP
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Switch between signin/signup */}
          <div className="mt-6 text-center space-y-3">
            {/* Forgot Password - only show for signin */}
            {currentMode === 'signin' && (
              <div>
                <button
                  onClick={() => {
                    // Handle forgot password

                    // You can implement a forgot password modal or redirect
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <p className="text-sm text-gray-600">
              {currentMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  resetForm();
                  setCurrentMode(currentMode === 'signin' ? 'signup' : 'signin');
                }}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                {currentMode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAuthModal;
