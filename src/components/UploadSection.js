import React, { useState, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const UploadSection = ({ onUpload, isProcessing, isAuthenticated = false, onAuthRequired }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'text'
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Supported file types
  const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const supportedExtensions = ['.pdf', '.docx'];

  // Handle file validation
  const validateFile = (file) => {
    if (!file) return false;
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return false;
    }
    
    if (!supportedTypes.includes(file.type)) {
      setError('Only PDF and DOCX files are supported');
      return false;
    }
    
    setError('');
    return true;
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setError('');
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle text input validation
  const validateTextInput = (text) => {
    if (!text.trim()) {
      setError('Please enter some text');
      return false;
    }
    
    if (text.length < 50) {
      setError('Text should be at least 50 characters long');
      return false;
    }
    
    if (text.length > 50000) {
      setError('Text should be less than 50,000 characters');
      return false;
    }
    
    setError('');
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Check authentication before proceeding
    if (!isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    if (uploadMethod === 'file') {
      if (!selectedFile) {
        setError('Please select a file');
        return;
      }
      await onUpload(selectedFile, null);
    } else {
      if (!validateTextInput(textInput)) {
        return;
      }
      await onUpload(null, textInput);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setTextInput('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Upload Method Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-accent-100 dark:bg-accent-800 p-1 rounded-lg">
          <button
            onClick={() => setUploadMethod('file')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              uploadMethod === 'file'
                ? 'bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100 shadow-sm'
                : 'text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setUploadMethod('text')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              uploadMethod === 'text'
                ? 'bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100 shadow-sm'
                : 'text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100'
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-1 gap-8">
        {/* File Upload Section */}
        {uploadMethod === 'file' && (
          <div className="card p-8 animate-fade-in">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : selectedFile
                  ? 'border-success-400 bg-success-50 dark:bg-success-900/20'
                  : 'border-accent-300 dark:border-accent-600 hover:border-accent-400 dark:hover:border-accent-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={supportedExtensions.join(',')}
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              
              <div className="space-y-4">
                {selectedFile ? (
                  <>
                    <CheckCircleIcon className="h-12 w-12 text-success-500 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-success-700 dark:text-success-300">
                        File Selected
                      </p>
                      <p className="text-sm text-accent-600 dark:text-accent-400">
                        {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-12 w-12 text-accent-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-accent-900 dark:text-accent-100">
                        Drop your legal document here
                      </p>
                      <p className="text-sm text-accent-600 dark:text-accent-400">
                        or click to browse files
                      </p>
                    </div>
                  </>
                )}
                
                <div className="text-xs text-accent-500 dark:text-accent-400">
                  Supports PDF and DOCX files up to 10MB
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={resetForm}
                  className="text-sm text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-accent-100 underline"
                >
                  Choose different file
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text Input Section */}
        {uploadMethod === 'text' && (
          <div className="card p-8 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-6 w-6 text-accent-600 dark:text-accent-400" />
                <h3 className="text-lg font-medium text-accent-900 dark:text-accent-100">
                  Paste Legal Text
                </h3>
              </div>
              
              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste the text of your legal document here..."
                className="input-field min-h-[200px] resize-none"
                disabled={isProcessing}
              />
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-accent-500 dark:text-accent-400">
                  {textInput.length} / 50,000 characters
                </span>
                <span className="text-accent-500 dark:text-accent-400">
                  Minimum 50 characters required
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg animate-slide-up">
            <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" />
            <span className="text-danger-700 dark:text-danger-300 text-sm">
              {error}
            </span>
          </div>
        )}

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || (!selectedFile && !textInput.trim())}
            className={`btn-primary text-lg px-8 py-3 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing Document...</span>
              </div>
            ) : isAuthenticated ? (
              'Simplify Document'
            ) : (
              'Sign In to Analyze Document'
            )}
          </button>
          
          {/* Authentication prompt for non-authenticated users */}
          {!isAuthenticated && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-amber-700 dark:text-amber-300 text-sm text-center">
                🔒 Sign in to unlock AI-powered legal document analysis with detailed clause explanations, risk assessments, and negotiation insights.
              </p>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="card p-6 animate-fade-in">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <div>
                <h3 className="text-lg font-medium text-accent-900 dark:text-accent-100">
                  Analyzing Your Document
                </h3>
                <p className="text-sm text-accent-600 dark:text-accent-400">
                  Our AI is reading through the legal text and generating insights...
                </p>
              </div>
            </div>
            
            <div className="mt-4 bg-accent-100 dark:bg-accent-700 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadSection;