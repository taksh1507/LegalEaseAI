import React, { useState, useEffect } from 'react';
import './index.css';

// Components
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import ResultsSection from './components/ResultsSection';
import ChatWidget from './components/ChatWidget';
import Footer from './components/Footer';
import AuthModalOTP from './components/AuthModalOTP';
import UserProfile from './components/UserProfile';
import ConnectionStatus from './components/ConnectionStatus';

// Services
import { TokenManager } from './services/authAPI';

// Mock data
import { mockSummary, mockClauses, mockRedFlags, mockChatHistory, mockChatResponses } from './data/mockData';

function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Document processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasDocument, setHasDocument] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState(mockChatHistory);

  // Navigation state
  const [activeSection, setActiveSection] = useState('home');

  // Authentication state
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [userProfileOpen, setUserProfileOpen] = useState(false);

  // Theme effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-login effect - check for existing token
  useEffect(() => {
    const checkExistingAuth = () => {
      if (TokenManager.isTokenValid()) {
        const tokenPayload = TokenManager.getTokenPayload();
        if (tokenPayload) {
          const user = {
            id: tokenPayload.userId,
            name: tokenPayload.name || tokenPayload.email?.split('@')[0] || 'User',
            email: tokenPayload.email,
            mobile_number: tokenPayload.mobile_number,
            profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(tokenPayload.name || tokenPayload.email?.split('@')[0] || 'User')}&background=3b82f6&color=ffffff`
          };
          setUser(user);
          setIsLoggedIn(true);
        }
      }
    };

    checkExistingAuth();
  }, []);

  // Handle document upload/processing
  const handleDocumentUpload = async (file, text) => {
    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const processedData = {
      summary: mockSummary,
      clauses: mockClauses,
      redFlags: mockRedFlags,
      fileName: file?.name || 'Pasted Text',
      processedAt: new Date().toISOString()
    };
    
    setDocumentData(processedData);
    setHasDocument(true);
    setIsProcessing(false);
    setActiveSection('results');
  };

  // Handle chat messages
  const handleSendMessage = (message) => {
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: generateAIResponse(message),
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  // Simple AI response generator
  const generateAIResponse = (message) => {
    // Use mock responses for more realistic conversation
    return mockChatResponses[Math.floor(Math.random() * mockChatResponses.length)];
  };

  // Reset document state
  const handleNewDocument = () => {
    setHasDocument(false);
    setDocumentData(null);
    setActiveSection('home');
    setChatMessages(mockChatHistory);
  };

  // Authentication handlers
  const handleSignIn = () => {
    setAuthMode('signin');
    setAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData) => {
    // Handle real authentication success
    const user = {
      id: userData.userId || userData.id,
      name: userData.name || userData.email?.split('@')[0] || 'User',
      email: userData.email,
      mobile_number: userData.mobile_number,
      email_verified: userData.email_verified,
      mobile_verified: userData.mobile_verified,
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.email?.split('@')[0] || 'User')}&background=3b82f6&color=ffffff`
    };
    
    setUser(user);
    setIsLoggedIn(true);
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    TokenManager.removeToken();
    setUser(null);
    setIsLoggedIn(false);
    setUserProfileOpen(false);
  };

  const handleUserUpdate = (updatedUserData) => {
    setUser(updatedUserData);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900 dark:to-accent-800 transition-colors duration-300`}>
      {/* Navbar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onNewDocument={handleNewDocument}
        user={user}
        isLoggedIn={isLoggedIn}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onProfileClick={() => setUserProfileOpen(true)}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeSection === 'home' && (
          <div className="animate-fade-in">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-accent-900 dark:text-accent-100 mb-4">
                Simplify Legal Documents with{' '}
                <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  AI
                </span>
              </h1>
              <p className="text-xl text-accent-600 dark:text-accent-300 max-w-3xl mx-auto">
                Upload contracts, rental agreements, and complex legal documents. 
                Get instant summaries, clause explanations, and risk analysis.
              </p>
            </div>

            {/* Upload Section */}
            <UploadSection
              onUpload={handleDocumentUpload}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {activeSection === 'results' && hasDocument && (
          <div className="animate-fade-in">
            <ResultsSection
              documentData={documentData}
              onNewDocument={handleNewDocument}
            />
          </div>
        )}

        {activeSection === 'upload' && (
          <div className="animate-fade-in">
            <UploadSection
              onUpload={handleDocumentUpload}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-accent-900 dark:text-accent-100 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "What types of documents can I upload?",
                  a: "LegalEaseAI supports PDF and DOCX files, including contracts, rental agreements, terms of service, privacy policies, and other legal documents."
                },
                {
                  q: "Is my document data secure?",
                  a: "Yes, we use enterprise-grade encryption and do not store your documents after processing. All analysis is done securely and your data remains private."
                },
                {
                  q: "How accurate is the AI analysis?",
                  a: "Our AI provides helpful insights and explanations, but should not replace professional legal advice. Always consult with a qualified attorney for important legal matters."
                }
              ].map((faq, index) => (
                <div key={index} className="card p-6">
                  <h3 className="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-accent-600 dark:text-accent-300">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-accent-900 dark:text-accent-100 mb-8">
              Contact Us
            </h2>
            <div className="card p-8">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                    Name
                  </label>
                  <input type="text" className="input-field" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                    Email
                  </label>
                  <input type="email" className="input-field" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                    Message
                  </label>
                  <textarea rows={4} className="input-field" placeholder="Your message..."></textarea>
                </div>
                <button type="submit" className="btn-primary w-full">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Chat Widget */}
      {hasDocument && (
        <ChatWidget
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
        />
      )}

      {/* Footer */}
      <Footer />

      {/* Authentication Modal */}
      <AuthModalOTP
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        mode={authMode}
      />

      {/* User Profile Modal */}
      <UserProfile
        isOpen={userProfileOpen}
        user={user}
        onClose={() => setUserProfileOpen(false)}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />

      {/* Connection Status Indicator */}
      <ConnectionStatus />
    </div>
  );
}

export default App;