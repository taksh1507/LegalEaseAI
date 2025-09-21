import React, { useState, useEffect } from 'react';
import './index.css';

// Components
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import ResultsSection from './components/ResultsSection';
import ChatWidget from './components/ChatWidget';
import Footer from './components/Footer';
import EnhancedAuthModal from './components/EnhancedAuthModal';
import UserProfile from './components/UserProfile';
import InfoModal from './components/InfoModal';

import { 
  TermsOfServiceContent, 
  PrivacyPolicyContent, 
  CookiePolicyContent, 
  AboutUsContent, 
  BlogContent, 
  CareersContent, 
  HelpCenterContent, 
  ApiDocumentationContent 
} from './components/ModalContent';

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
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm LegalEaseAI, your legal assistant. I can help you understand legal documents, answer questions about contracts, and provide general legal guidance. Feel free to ask me anything!",
      sender: "ai",
      timestamp: new Date().toISOString()
    }
  ]);

  // Navigation state
  const [activeSection, setActiveSection] = useState('home');

  // Authentication state
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [userProfileOpen, setUserProfileOpen] = useState(false);

  // Modal state for footer links
  const [activeModal, setActiveModal] = useState(null);



  // Modal content mapping
  const modalContent = {
    'terms-of-service': { title: 'Terms of Service', component: TermsOfServiceContent },
    'privacy-policy': { title: 'Privacy Policy', component: PrivacyPolicyContent },
    'cookie-policy': { title: 'Cookie Policy', component: CookiePolicyContent },
    'about-us': { title: 'About Us', component: AboutUsContent },
    'blog': { title: 'Blog', component: BlogContent },
    'careers': { title: 'Careers', component: CareersContent },
    'help-center': { title: 'Help Center', component: HelpCenterContent },
    'api-documentation': { title: 'API Documentation', component: ApiDocumentationContent }
  };

  const handleOpenModal = (modalKey) => {
    setActiveModal(modalKey);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  // Theme effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Authentication restoration effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsLoggedIn(true);
        console.log('✅ User authentication restored from localStorage');
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Chat event listeners
  useEffect(() => {
    const handleNewChatRequested = () => {
      setChatMessages([
        {
          id: 1,
          text: "Hi! I'm LegalEaseAI, your legal assistant. I can help you understand legal documents, answer questions about contracts, and provide general legal guidance. Feel free to ask me anything!",
          sender: "ai",
          timestamp: new Date().toISOString()
        }
      ]);
    };

    const handleLoadChatFromHistory = (event) => {
      const { messages } = event.detail;
      setChatMessages(messages);
    };

    const handleLoadPreviousAnalysis = (event) => {
      const analysisData = event.detail;
      console.log('📋 App.js: Loading previous analysis:', analysisData);
      
      if (!analysisData) {
        console.error('❌ App.js: No analysis data received');
        return;
      }
      
      setDocumentData(analysisData);
      setHasDocument(true);
      setActiveSection('results'); // Navigate to results view to show the analysis
      
      console.log('✅ App.js: Document data set, hasDocument:', true, 'activeSection:', 'results');
      
      // Optional: Add a message to chat indicating the document was loaded
      const loadMessage = {
        id: Date.now(),
        text: `📄 Loaded previous analysis of "${analysisData.fileName || 'Document'}". You can now view the analysis results or ask questions about this document.`,
        sender: "ai",
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, loadMessage]);
    };

    window.addEventListener('newChatRequested', handleNewChatRequested);
    window.addEventListener('loadChatFromHistory', handleLoadChatFromHistory);
    window.addEventListener('loadPreviousAnalysis', handleLoadPreviousAnalysis);

    return () => {
      window.removeEventListener('newChatRequested', handleNewChatRequested);
      window.removeEventListener('loadChatFromHistory', handleLoadChatFromHistory);
      window.removeEventListener('loadPreviousAnalysis', handleLoadPreviousAnalysis);
    };
  }, []);

  // Handle document upload/processing
  const handleDocumentUpload = async (file, text) => {
    setIsProcessing(true);
    
    try {
      let response;
      
      if (file) {
        // Analyze uploaded file
        const formData = new FormData();
        formData.append('document', file);
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        response = await fetch(`${apiUrl}/api/document/analyze-file`, {
          method: 'POST',
          body: formData
        });
      } else if (text) {
        // Handle text analysis
        console.log('📤 Analyzing text content');
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        response = await fetch(`${apiUrl}/api/document/analyze-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        });
      } else {
        throw new Error('No file or text provided');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Received analysis response:', data);
      
      if (data.success) {
        // Transform the backend response to match frontend expectations
        const processedData = {
          summary: {
            title: data.data?.summary || 'Document Analysis',
            description: data.data?.summary || 'Analysis completed successfully',
            keyPoints: data.data?.clauses?.map(clause => clause.title || clause.content) || [],
            stats: {
              totalClauses: data.data?.clauses?.length || 0,
              riskyClauses: data.data?.redFlags?.length || 0,
              readingTime: '5 min'
            }
          },
          clauses: data.data?.clauses?.map((clause, index) => ({
            id: index + 1,
            title: clause.title || `Clause ${index + 1}`,
            originalText: clause.content || clause.explanation || 'No content available',
            explanation: clause.explanation || clause.content || 'No explanation available',
            riskLevel: clause.importance === 'high' ? 'high' : clause.importance === 'medium' ? 'medium' : 'low',
            riskAssessment: clause.explanation || 'Risk assessment not available',
            keyTerms: [],
            recommendations: []
          })) || [],
          redFlags: data.data?.redFlags?.map((flag, index) => ({
            id: index + 1,
            title: flag.issue || 'Red Flag',
            description: flag.explanation || 'No description available',
            severity: flag.severity || 'medium',
            location: `Clause ${index + 1}`
          })) || [],
          fileName: file?.name || 'Text Analysis',
          processedAt: new Date().toISOString()
        };
        
        console.log('📋 Processed data for frontend:', processedData);
        setDocumentData(processedData);
        setHasDocument(true);
        setActiveSection('results');


      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('❌ Document analysis error:', error);
      alert(`Error analyzing document: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle chat messages
  const handleSendMessage = async (message) => {
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
      console.log('💬 Sending chat message to AI...');
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message,
          context: documentData ? `User is analyzing a document: ${documentData.fileName}` : ''
        })
      });
      
      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Received chat response:', data);
      
      const aiResponse = {
        id: Date.now() + 1,
        text: data.success ? data.response : (data.message || 'Sorry, I encountered an error. Please try again.'),
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('❌ Chat error:', error);
      
      const errorResponse = {
        id: Date.now() + 1,
        text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, errorResponse]);
    }
  };

  // Reset document state
  const handleNewDocument = () => {
    setHasDocument(false);
    setDocumentData(null);
    setActiveSection('home');
    setChatMessages([
      {
        id: 1,
        text: "Hi! I'm LegalEaseAI, your legal assistant. I can help you understand legal documents, answer questions about contracts, and provide general legal guidance. Feel free to ask me anything!",
        sender: "ai",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Authentication handlers
  const handleSignIn = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    // Clear authentication state
    setUser(null);
    setIsLoggedIn(false);
    setUserProfileOpen(false);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset document state
    setDocumentData(null);
    setHasDocument(false);
    setActiveSection('home');
    
    console.log('✅ User logged out successfully');
  };

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
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
              <p className="text-xl text-accent-600 dark:text-accent-300 max-w-3xl mx-auto mb-6">
                Upload contracts, rental agreements, and complex legal documents. 
                Get instant summaries, clause explanations, and risk analysis.
              </p>
              
              {/* Feature highlights for authenticated vs non-authenticated users */}
              {isLoggedIn ? (
                <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-success-700 dark:text-success-300 font-medium">
                    ✅ Ready to analyze! Upload your document below to get comprehensive AI analysis with detailed insights.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-blue-700 dark:text-blue-300 font-medium">
                    🔒 Sign in to unlock detailed clause analysis, risk assessment, negotiation tips, and legal insights
                  </p>
                </div>
              )}
            </div>

            {/* Upload Section */}
            <UploadSection
              onUpload={handleDocumentUpload}
              isProcessing={isProcessing}
              isAuthenticated={isLoggedIn}
              onAuthRequired={() => setAuthModalOpen(true)}
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
              isAuthenticated={isLoggedIn}
              onAuthRequired={() => setAuthModalOpen(true)}
            />
          </div>
        )}

        {activeSection === 'how-it-works' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-accent-900 dark:text-accent-100 mb-8">
              How It Works
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">1</span>
                </div>
                <h3 className="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-3">
                  Upload Document
                </h3>
                <p className="text-accent-600 dark:text-accent-300">
                  Upload your legal document (PDF or DOCX) or paste text directly into our secure platform.
                </p>
              </div>
              
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">2</span>
                </div>
                <h3 className="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-3">
                  AI Analysis
                </h3>
                <p className="text-accent-600 dark:text-accent-300">
                  Our advanced AI analyzes your document, identifying key clauses, potential risks, and important terms.
                </p>
              </div>
              
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">3</span>
                </div>
                <h3 className="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-3">
                  Get Insights
                </h3>
                <p className="text-accent-600 dark:text-accent-300">
                  Receive detailed explanations, risk assessments, and actionable recommendations in plain English.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="card p-8">
                <h3 className="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-4">
                  🔍 What We Analyze
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">Document Types</h4>
                    <ul className="text-accent-600 dark:text-accent-300 space-y-1">
                      <li>• Employment Contracts</li>
                      <li>• Rental Agreements</li>
                      <li>• Service Contracts</li>
                      <li>• Terms of Service</li>
                      <li>• Privacy Policies</li>
                      <li>• NDAs & Confidentiality Agreements</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">Analysis Features</h4>
                    <ul className="text-accent-600 dark:text-accent-300 space-y-1">
                      <li>• Risk Level Assessment</li>
                      <li>• Key Clause Identification</li>
                      <li>• Red Flag Detection</li>
                      <li>• Plain English Explanations</li>
                      <li>• Negotiation Suggestions</li>
                      <li>• Legal Term Definitions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="card p-8">
                <h3 className="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-4">
                  🛡️ Security & Privacy
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 dark:text-green-400 text-xl">🔒</span>
                    </div>
                    <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">Encrypted</h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      All uploads are encrypted using industry-standard encryption
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 dark:text-blue-400 text-xl">🗑️</span>
                    </div>
                    <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">Auto-Delete</h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      Documents are automatically deleted after processing
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 dark:text-purple-400 text-xl">🔐</span>
                    </div>
                    <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">Private</h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      Your data is never shared or stored permanently
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'ai-help' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-accent-900 dark:text-accent-100 mb-8">
              AI Help & Assistant
            </h2>
            
            <div className="card p-8 mb-8">
              <h3 className="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-4">
                🤖 Meet Your AI Legal Assistant
              </h3>
              <p className="text-accent-600 dark:text-accent-300 mb-6">
                Our AI assistant is here to help you understand legal documents, answer questions, and provide guidance. 
                Click the chat icon in the bottom right to start a conversation!
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-3">What I Can Help With:</h4>
                  <ul className="text-accent-600 dark:text-accent-300 space-y-2">
                    <li>📋 Explaining legal documents in plain English</li>
                    <li>⚠️ Identifying potential risks and red flags</li>
                    <li>📖 Defining legal terms and concepts</li>
                    <li>💡 Suggesting negotiation points</li>
                    <li>🔍 Clarifying confusing clauses</li>
                    <li>📚 Providing general legal guidance</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-3">How to Get Started:</h4>
                  <ul className="text-accent-600 dark:text-accent-300 space-y-2">
                    <li>1️⃣ Upload a document for analysis</li>
                    <li>2️⃣ Click the chat icon to open AI assistant</li>
                    <li>3️⃣ Ask questions about your document</li>
                    <li>4️⃣ Get instant, helpful responses</li>
                    <li>5️⃣ Request clarifications anytime</li>
                    <li>6️⃣ Save chat history for later reference</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-4">
                  💬 Sample Questions
                </h3>
                <div className="space-y-3">
                  <div className="bg-accent-50 dark:bg-accent-800 p-3 rounded">
                    <p className="text-sm font-medium text-accent-900 dark:text-accent-100">
                      "What does this termination clause mean?"
                    </p>
                  </div>
                  <div className="bg-accent-50 dark:bg-accent-800 p-3 rounded">
                    <p className="text-sm font-medium text-accent-900 dark:text-accent-100">
                      "Are there any red flags in this contract?"
                    </p>
                  </div>
                  <div className="bg-accent-50 dark:bg-accent-800 p-3 rounded">
                    <p className="text-sm font-medium text-accent-900 dark:text-accent-100">
                      "What should I negotiate in this agreement?"
                    </p>
                  </div>
                  <div className="bg-accent-50 dark:bg-accent-800 p-3 rounded">
                    <p className="text-sm font-medium text-accent-900 dark:text-accent-100">
                      "Explain the liability section in simple terms"
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-4">
                  ⚡ Quick Tips
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-accent-900 dark:text-accent-100">Be Specific</h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      Ask about specific clauses or sections for more targeted help
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-accent-900 dark:text-accent-100">Follow Up</h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      Don't hesitate to ask for clarification if something isn't clear
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-accent-900 dark:text-accent-100">Context Matters</h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      Provide context about your situation for better guidance
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-accent-900 dark:text-accent-100">Professional Advice</h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      Remember: AI guidance supplements but doesn't replace legal counsel
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-8 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800">
              <h3 className="text-xl font-semibold text-primary-900 dark:text-primary-100 mb-4">
                🚀 Ready to Get Started?
              </h3>
              <p className="text-primary-700 dark:text-primary-300 mb-6">
                Upload your first document and experience the power of AI-assisted legal analysis!
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setActiveSection('home')}
                  className="btn-primary"
                >
                  Upload Document
                </button>
                <button 
                  onClick={() => setIsChatOpen(true)}
                  className="btn-secondary"
                >
                  Open AI Chat
                </button>
              </div>
            </div>
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
          <div className="animate-fade-in max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-accent-900 dark:text-accent-100 mb-8 text-center">
              Contact Us
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <div className="card p-8">
                  <h3 className="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-6">
                    Get In Touch
                  </h3>
                  <p className="text-accent-600 dark:text-accent-300 mb-6">
                    Have questions about LegalEaseAI? Need help with your legal documents? 
                    We're here to help! Reach out to our team for support, feedback, or general inquiries.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400">📧</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-accent-900 dark:text-accent-100">Email</h4>
                        <p className="text-accent-600 dark:text-accent-300">support@legalease.ai</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400">⏰</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-accent-900 dark:text-accent-100">Response Time</h4>
                        <p className="text-accent-600 dark:text-accent-300">Usually within 24 hours</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400">🌍</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-accent-900 dark:text-accent-100">Support Hours</h4>
                        <p className="text-accent-600 dark:text-accent-300">24/7 AI Assistant Available</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ Quick Links */}
                <div className="card p-6">
                  <h3 className="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-4">
                    Common Questions
                  </h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveSection('faq')}
                      className="w-full text-left p-3 bg-accent-50 dark:bg-accent-800 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-700 transition-colors duration-200"
                    >
                      <h4 className="font-medium text-accent-900 dark:text-accent-100">What types of documents can I upload?</h4>
                      <p className="text-sm text-accent-600 dark:text-accent-300">Click to view our FAQ section</p>
                    </button>
                    <button 
                      onClick={() => setActiveSection('faq')}
                      className="w-full text-left p-3 bg-accent-50 dark:bg-accent-800 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-700 transition-colors duration-200"
                    >
                      <h4 className="font-medium text-accent-900 dark:text-accent-100">Is my document data secure?</h4>
                      <p className="text-sm text-accent-600 dark:text-accent-300">Learn about our security measures</p>
                    </button>
                    <button 
                      onClick={() => setActiveSection('ai-help')}
                      className="w-full text-left p-3 bg-accent-50 dark:bg-accent-800 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-700 transition-colors duration-200"
                    >
                      <h4 className="font-medium text-accent-900 dark:text-accent-100">How do I use the AI assistant?</h4>
                      <p className="text-sm text-accent-600 dark:text-accent-300">Get help with AI features</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="card p-8">
                <h3 className="text-2xl font-semibold text-accent-900 dark:text-accent-100 mb-6">
                  Send Us a Message
                </h3>
                <form 
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert('Thank you for your message! We will get back to you soon.');
                  }}
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                        First Name *
                      </label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="John" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                        Last Name *
                      </label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Doe" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                      Email Address *
                    </label>
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder="john.doe@example.com" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                      Company/Organization (Optional)
                    </label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Your company name" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                      Subject *
                    </label>
                    <select className="input-field" required>
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing & Pricing</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2">
                      Message *
                    </label>
                    <textarea 
                      rows={6} 
                      className="input-field resize-none" 
                      placeholder="Please describe your question or concern in detail. The more information you provide, the better we can assist you."
                      required
                    ></textarea>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <input 
                      type="checkbox" 
                      id="privacy-consent" 
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-accent-300 rounded" 
                      required 
                    />
                    <label htmlFor="privacy-consent" className="text-sm text-accent-600 dark:text-accent-300">
                      I agree to the processing of my personal data for the purpose of responding to my inquiry. 
                      Your information will be handled according to our privacy policy. *
                    </label>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Send Message
                  </button>
                  
                  <p className="text-sm text-accent-500 dark:text-accent-400 text-center">
                    * Required fields. We typically respond within 24 hours during business days.
                  </p>
                </form>
              </div>
            </div>

            {/* Additional Support Options */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 dark:text-blue-400 text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2">
                  AI Assistant
                </h3>
                <p className="text-accent-600 dark:text-accent-300 mb-4">
                  Get instant help with our AI chat assistant available 24/7
                </p>
                <button 
                  onClick={() => setIsChatOpen(true)}
                  className="btn-secondary w-full"
                >
                  Open AI Chat
                </button>
              </div>
              
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 dark:text-green-400 text-2xl">📚</span>
                </div>
                <h3 className="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2">
                  Documentation
                </h3>
                <p className="text-accent-600 dark:text-accent-300 mb-4">
                  Find answers in our comprehensive guides and tutorials
                </p>
                <button 
                  onClick={() => setActiveSection('how-it-works')}
                  className="btn-secondary w-full"
                >
                  View Guides
                </button>
              </div>
              
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 dark:text-purple-400 text-2xl">❓</span>
                </div>
                <h3 className="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2">
                  FAQ
                </h3>
                <p className="text-accent-600 dark:text-accent-300 mb-4">
                  Browse frequently asked questions for quick answers
                </p>
                <button 
                  onClick={() => setActiveSection('faq')}
                  className="btn-secondary w-full"
                >
                  View FAQ
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Chat Widget - Always visible */}
      <ChatWidget
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isAuthenticated={isLoggedIn}
        onAuthRequired={() => setAuthModalOpen(true)}
      />

      {/* Footer */}
      <Footer onNavigate={setActiveSection} onOpenModal={handleOpenModal} />

      {/* Enhanced Authentication Modal */}
      <EnhancedAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile Modal */}
      <UserProfile
        isOpen={userProfileOpen}
        user={user}
        onClose={() => setUserProfileOpen(false)}
        onLogout={handleLogout}
      />



      {/* Info Modals for Footer Links */}
      {activeModal && modalContent[activeModal] && (
        <InfoModal
          isOpen={true}
          onClose={handleCloseModal}
          title={modalContent[activeModal].title}
        >
          {React.createElement(modalContent[activeModal].component)}
        </InfoModal>
      )}
    </div>
  );
}

export default App;