import React, { useState } from 'react';
import { 
  UserCircleIcon, 
  XMarkIcon, 
  CalendarIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  IdentificationIcon,
  PencilIcon,
  CheckIcon,
  XCircleIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const UserProfile = ({ isOpen, user, onClose, onLogout }) => {
  const [editMode, setEditMode] = useState({
    name: false,
    email: false,
    phone: false
  });
  const [editedData, setEditedData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [currentUser, setCurrentUser] = useState(user); // Track current user data
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [otpVerification, setOtpVerification] = useState({
    show: false,
    field: '',
    otp: '',
    newValue: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update currentUser when user prop changes or component mounts
  React.useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      // Try to get updated user from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    }
  }, [user]);

  if (!isOpen) return null;

  // Use currentUser instead of a static userData object
  const userData = currentUser || {
    name: 'John Doe',
    email: 'john.doe@example.com',
    subscription: 'Free'
  };

  // Initialize edited data when entering edit mode
  const handleEdit = (field) => {
    setEditedData({
      ...editedData,
      [field]: userData[field] || ''
    });
    setEditMode({
      ...editMode,
      [field]: true
    });
    setError('');
    setSuccess('');
  };

  // Cancel edit mode
  const handleCancelEdit = (field) => {
    setEditMode({
      ...editMode,
      [field]: false
    });
    setEditedData({
      ...editedData,
      [field]: ''
    });
    setError('');
  };

  // Save field changes with OTP verification for sensitive fields
  const handleSaveField = async (field) => {
    if (!editedData[field] || editedData[field] === userData[field]) {
      handleCancelEdit(field);
      return;
    }

    // For email and phone changes, require OTP verification
    if (field === 'email' || field === 'phone') {
      setOtpVerification({
        show: true,
        field: field,
        otp: '',
        newValue: editedData[field]
      });
      return;
    }

    // For name changes, update directly
    if (field === 'name') {
      await updateProfile({ [field]: editedData[field] });
    }
  };

  // Update profile function
  const updateProfile = async (updates) => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Profile updated successfully!');
        // Update local storage with new user data
        localStorage.setItem('user', JSON.stringify(data.user));
        // Update local state immediately
        setCurrentUser(data.user);
        // Reset edit mode
        Object.keys(editMode).forEach(key => {
          setEditMode(prev => ({ ...prev, [key]: false }));
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for profile changes
  const sendOTPForProfileChange = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = otpVerification.field === 'email' 
        ? '/api/auth/send-email-otp-profile' 
        : '/api/auth/send-phone-otp-profile';
      
      const payload = {
        [otpVerification.field]: otpVerification.newValue
      };

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`OTP sent to ${otpVerification.newValue}`);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and update profile
  const verifyOTPAndUpdate = async () => {
    if (!otpVerification.otp || otpVerification.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/verify-profile-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          field: otpVerification.field,
          newValue: otpVerification.newValue,
          otp: otpVerification.otp
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`${otpVerification.field} updated successfully!`);
        // Update local storage with new user data
        localStorage.setItem('user', JSON.stringify(data.user));
        // Update local state immediately
        setCurrentUser(data.user);
        setOtpVerification({ show: false, field: '', otp: '', newValue: '' });
        setEditMode({ ...editMode, [otpVerification.field]: false });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to verify OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowChangePassword(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-accent-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-auto my-8 animate-slide-up-modal max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-accent-900 dark:text-accent-100">
            User Profile
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-accent-100 dark:hover:bg-accent-800 rounded-lg">
            <XMarkIcon className="h-5 w-5 text-accent-500" />
          </button>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* OTP Verification Modal */}
        {otpVerification.show && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              Verify {otpVerification.field === 'email' ? 'Email' : 'Phone'} Change
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Enter the OTP sent to: <strong>{otpVerification.newValue}</strong>
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={otpVerification.otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpVerification(prev => ({ ...prev, otp: value }));
                }}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-center tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={verifyOTPAndUpdate}
                disabled={loading || otpVerification.otp.length !== 6}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                onClick={sendOTPForProfileChange}
                disabled={loading}
                className="px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 text-sm"
              >
                Resend
              </button>
              <button
                onClick={() => {
                  setOtpVerification({ show: false, field: '', otp: '', newValue: '' });
                  setEditMode({ ...editMode, [otpVerification.field]: false });
                }}
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className="flex justify-center mb-6">
          <div className="relative">
            <UserCircleIcon className="h-20 w-20 text-accent-400" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Full Name - Editable */}
          <div className="bg-accent-50 dark:bg-accent-800 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <IdentificationIcon className="h-4 w-4 text-accent-500 mr-2" />
                <label className="block text-sm font-medium text-accent-700 dark:text-accent-300">
                  Full Name
                </label>
              </div>
              {!editMode.name && (
                <button
                  onClick={() => handleEdit('name')}
                  className="p-1 text-accent-500 hover:text-accent-700 hover:bg-accent-200 rounded"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            {editMode.name ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedData.name}
                  onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Enter your name"
                />
                <button
                  onClick={() => handleSaveField('name')}
                  disabled={loading}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleCancelEdit('name')}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <XCircleIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-accent-900 dark:text-accent-100 font-medium">{userData.name || 'Not provided'}</p>
            )}
          </div>

          {/* Email - Editable with OTP verification */}
          <div className="bg-accent-50 dark:bg-accent-800 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 text-accent-500 mr-2" />
                <label className="block text-sm font-medium text-accent-700 dark:text-accent-300">
                  Email Address
                </label>
              </div>
              {!editMode.email && userData.email && (
                <button
                  onClick={() => handleEdit('email')}
                  className="p-1 text-accent-500 hover:text-accent-700 hover:bg-accent-200 rounded"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            {editMode.email ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={editedData.email}
                  onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Enter your email"
                />
                <button
                  onClick={() => handleSaveField('email')}
                  disabled={loading}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                  title="Requires OTP verification"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleCancelEdit('email')}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <XCircleIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-accent-900 dark:text-accent-100 font-medium">{userData.email || 'Not provided'}</p>
                {!userData.email && (
                  <button
                    onClick={() => handleEdit('email')}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Add Email
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Phone - Editable with OTP verification */}
          <div className="bg-accent-50 dark:bg-accent-800 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 text-accent-500 mr-2" />
                <label className="block text-sm font-medium text-accent-700 dark:text-accent-300">
                  Phone Number
                </label>
              </div>
              {!editMode.phone && userData.phone && (
                <button
                  onClick={() => handleEdit('phone')}
                  className="p-1 text-accent-500 hover:text-accent-700 hover:bg-accent-200 rounded"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            {editMode.phone ? (
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={editedData.phone}
                  onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Enter your phone number"
                />
                <button
                  onClick={() => handleSaveField('phone')}
                  disabled={loading}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                  title="Requires OTP verification"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleCancelEdit('phone')}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <XCircleIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-accent-900 dark:text-accent-100 font-medium">{userData.phone || 'Not provided'}</p>
                {!userData.phone && (
                  <button
                    onClick={() => handleEdit('phone')}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Add Phone
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Registration Date */}
          <div className="bg-accent-50 dark:bg-accent-800 p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <CalendarIcon className="h-4 w-4 text-accent-500 mr-2" />
              <label className="block text-sm font-medium text-accent-700 dark:text-accent-300">
                Member Since
              </label>
            </div>
            <p className="text-accent-900 dark:text-accent-100 font-medium">
              {formatDate(userData.created_at || userData.createdAt)}
            </p>
          </div>

          {/* Account Status */}
          <div className="bg-accent-50 dark:bg-accent-800 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1">
                  Account Status
                </label>
                <p className="text-accent-900 dark:text-accent-100 font-medium">
                  {userData.subscription || 'Free'}
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* User ID for reference */}
          {userData.id && (
            <div className="bg-accent-50 dark:bg-accent-800 p-3 rounded-lg">
              <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1">
                User ID
              </label>
              <p className="text-xs text-accent-600 dark:text-accent-400 font-mono">#{userData.id}</p>
            </div>
          )}
        </div>

        {/* Change Password Section */}
        <div className="mt-6">
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <KeyIcon className="h-4 w-4" />
            {showChangePassword ? 'Cancel Password Change' : 'Change Password'}
          </button>

          {showChangePassword && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-accent-200 dark:border-accent-700">
          <button
            onClick={onLogout}
            className="w-full bg-danger-600 hover:bg-danger-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;