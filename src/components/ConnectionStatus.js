import React, { useState, useEffect } from 'react';
import authAPI from '../services/authAPI';

const ConnectionStatus = () => {
  const [status, setStatus] = useState('checking'); // 'checking', 'connected', 'disconnected'
  const [serverInfo, setServerInfo] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setStatus('checking');
      const response = await authAPI.getServerInfo();
      setServerInfo(response);
      setStatus('connected');
    } catch (error) {
      console.error('Backend connection failed:', error);
      setStatus('disconnected');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connected to Backend';
      case 'disconnected': return 'Backend Disconnected';
      default: return 'Checking Connection...';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white dark:bg-accent-800 rounded-lg shadow-lg p-3 border border-accent-200 dark:border-accent-700">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${status === 'checking' ? 'animate-pulse' : ''}`}></div>
          <span className="text-sm font-medium text-accent-700 dark:text-accent-300">
            {getStatusText()}
          </span>
          {status !== 'checking' && (
            <button
              onClick={checkConnection}
              className="text-xs text-primary-600 hover:text-primary-700 ml-2"
            >
              Refresh
            </button>
          )}
        </div>
        
        {status === 'connected' && serverInfo && (
          <div className="mt-2 text-xs text-accent-500">
            <div>{serverInfo.message}</div>
            <div>Authentication: {serverInfo.authentication}</div>
            <div className="flex space-x-2 mt-1">
              <span>DB: {serverInfo.configuration?.database}</span>
              <span>Email: {serverInfo.configuration?.emailService}</span>
            </div>
          </div>
        )}
        
        {status === 'disconnected' && (
          <div className="mt-2 text-xs text-red-600">
            Make sure your backend server is running on http://localhost:5000
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;