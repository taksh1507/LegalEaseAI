import { API_BASE_URL, authHeaders } from './config';
import React, { useState, useEffect } from 'react';
import './index.css';

// Components
import Navbar from './components/Navbar';
import AnalysisHistory from './components/AnalysisHistory';
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
  ApiDocumentationContent,
} from './components/ModalContent';

function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('darkMode') || 'false') === true;
    } catch {
      return false;
    }
  });

  // Document processing state
  const [analysisError, setAnalysisError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasDocument, setHasDocument] = useState(false);
  const [documentData, setDocumentData] = useState(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm LegalEaseAI, your legal assistant. I can help you understand legal documents, answer questions about contracts, and provide general legal guidance. Feel free to ask me anything!",
      sender: 'ai',
      timestamp: new Date().toISOString(),
    },
  ]);

  // Navigation state
  const [activeSection, setActiveSection] = useState('home');

  // Authentication state
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'login' or 'signup'
  const [userProfileOpen, setUserProfileOpen] = useState(false);

  // Modal state for footer links
  const [activeModal, setActiveModal] = useState(null);

  // Modal content mapping
  const modalContent = {
    'terms-of-service': { title: 'Terms of Service', component: TermsOfServiceContent },
    'privacy-policy': { title: 'Privacy Policy', component: PrivacyPolicyContent },
    'cookie-policy': { title: 'Cookie Policy', component: CookiePolicyContent },
    'about-us': { title: 'About this project', component: AboutUsContent },
    blog: { title: 'Engineering notes', component: BlogContent },
    careers: { title: 'Contributing', component: CareersContent },
    'help-center': { title: 'Help Center', component: HelpCenterContent },
    'api-documentation': { title: 'API Documentation', component: ApiDocumentationContent },
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
    let cancelled = false;
    const expired = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsLoggedIn(false);
      setDocumentData(null);
      setHasDocument(false);
      setAnalysisError('Your session expired. Please sign in again.');
      setAuthModalOpen(true);
      setActiveSection('home');
    };
    window.addEventListener('auth-expired', expired);
    if (token)
      fetch(`${API_BASE_URL}/api/auth/profile`, { headers: authHeaders() })
        .then(async (response) => {
          if (cancelled) return;
          if (response.status === 401) {
            expired();
            return;
          }
          if (!response.ok) {
            setAnalysisError(
              'Your account could not be checked. Please retry when the service is available.',
            );
            return;
          }
          const result = await response.json();
          const current = result.user || result.data;
          if (current) {
            setUser(current);
            setIsLoggedIn(true);
            localStorage.setItem('user', JSON.stringify(current));
          }
        })
        .catch(() => {
          if (!cancelled)
            setAnalysisError(
              'The service is unavailable. Your saved credentials have not been changed.',
            );
        });
    return () => {
      cancelled = true;
      window.removeEventListener('auth-expired', expired);
    };
  }, []);

  // Chat event listeners
  useEffect(() => {
    const handleNewChatRequested = () => {
      setChatMessages([
        {
          id: 1,
          text: "Hi! I'm LegalEaseAI, your legal assistant. I can help you understand legal documents, answer questions about contracts, and provide general legal guidance. Feel free to ask me anything!",
          sender: 'ai',
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const handleLoadChatFromHistory = (event) => {
      const { messages } = event.detail;
      setChatMessages(messages);
    };

    const handleLoadPreviousAnalysis = (event) => {
      const analysisData = event.detail;

      if (!analysisData) {
        console.error('❌ App.js: No analysis data received');
        return;
      }

      setDocumentData(analysisData);
      setHasDocument(true);
      setActiveSection('results'); // Navigate to results view to show the analysis

      // Optional: Add a message to chat indicating the document was loaded
      const loadMessage = {
        id: Date.now(),
        text: `📄 Loaded previous analysis of "${analysisData.fileName || 'Document'}". You can now view the analysis results or ask questions about this document.`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, loadMessage]);
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
    const requestToken = localStorage.getItem('token');
    setAnalysisError('');
    setIsProcessing(true);

    try {
      let response;

      if (file) {
        // Analyze uploaded file
        const formData = new FormData();
        formData.append('document', file);

        const apiUrl = API_BASE_URL;
        response = await fetch(`${apiUrl}/api/document/analyze-file`, {
          method: 'POST',
          headers: authHeaders(),
          body: formData,
        });
      } else if (text) {
        // Handle text analysis

        const apiUrl = API_BASE_URL;
        response = await fetch(`${apiUrl}/api/document/analyze-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ text }),
        });
      } else {
        throw new Error('No file or text provided');
      }

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) window.dispatchEvent(new CustomEvent('auth-expired'));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (localStorage.getItem('token') !== requestToken) return;

      if (data.success) {
        // Transform the backend response to match frontend expectations
        const analysis = data.data;
        const processedData = {
          ...analysis,
          summary: {
            title: 'Document summary',
            description: analysis.summary,
            keyPoints: analysis.clauses.map((clause) => clause.title),
            stats: {
              totalClauses: analysis.clauses.length,
              riskyClauses: analysis.redFlags.length,
              readingTime: analysis.documentStats
                ? `${Math.max(1, Math.ceil(analysis.documentStats.wordCount / 200))} min (est.)`
                : 'Not estimated',
            },
          },
          clauses: analysis.clauses.map((clause, index) => ({ ...clause, id: index + 1 })),
          redFlags: analysis.redFlags.map((flag, index) => ({
            ...flag,
            id: index + 1,
            title: flag.issue,
            description: flag.explanation,
          })),
          fileName: file?.name || 'Text analysis',
          processedAt: new Date().toISOString(),
        };
        setAnalysisError('');
        try {
          const saved = await fetch(`${API_BASE_URL}/api/document-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({
              fileName: processedData.fileName,
              documentType: analysis.documentType,
              summary: analysis.summary,
              riskLevel: analysis.overallRiskLevel,
              redFlagsCount: analysis.redFlags.length,
              clausesCount: analysis.clauses.length,
              analysisData: processedData,
            }),
          });
          if (!saved.ok)
            setAnalysisError(
              'Analysis is ready, but it could not be saved to History. Download the report before leaving this page.',
            );
        } catch {
          setAnalysisError(
            'Analysis is ready, but it could not be saved to History. Download the report before leaving this page.',
          );
        }

        if (localStorage.getItem('token') !== requestToken) return;
        setDocumentData(processedData);
        setHasDocument(true);
        setActiveSection('results');
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('❌ Document analysis error:', error);
      if (localStorage.getItem('token') === requestToken) setAnalysisError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle chat messages
  const handleSendMessage = async (message) => {
    const requestToken = localStorage.getItem('token');
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);

    try {
      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          message,
          context: documentData
            ? JSON.stringify({
                fileName: documentData.fileName,
                summary: documentData.summary.description,
                clauses: documentData.clauses,
                redFlags: documentData.redFlags,
              })
            : '',
        }),
      });

      if (!response.ok) {
        const failure = await response.json();
        if (response.status === 401) window.dispatchEvent(new CustomEvent('auth-expired'));
        throw new Error(failure.message || 'Chat service unavailable');
      }

      const data = await response.json();
      if (localStorage.getItem('token') !== requestToken) return;

      const aiResponse = {
        id: Date.now() + 1,
        text: data.success
          ? data.response
          : data.message || 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      if (localStorage.getItem('token') !== requestToken) return;

      const errorResponse = {
        id: Date.now() + 1,
        text: error.message || 'Chat service unavailable. Please retry.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, errorResponse]);
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
        sender: 'ai',
        timestamp: new Date().toISOString(),
      },
    ]);
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
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900 dark:to-accent-800 transition-colors duration-300`}
    >
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
      <main id="main-content" className="container mx-auto px-4 py-8">
        {analysisError && (
          <div
            role="alert"
            className="max-w-5xl mx-auto mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
          >
            {analysisError}
          </div>
        )}
        {activeSection === 'home' && (
          <div className="animate-fade-in">
            <section className="workspace-hero">
              <div>
                <p className="workspace-eyebrow">LEGAL CLARITY, WITH CONTEXT</p>
                <h1>
                  Read the fine print.
                  <br />
                  <span>Understand what matters.</span>
                </h1>
                <p className="workspace-intro">
                  A focused workspace for contract summaries, clause explanations and questions
                  worth asking before you sign.
                </p>
                <div className="workspace-chips">
                  <span>Clause-by-clause review</span>
                  <span>Document-aware chat</span>
                  <span>Exportable reports</span>
                </div>
                <p className="workspace-session">
                  {isLoggedIn
                    ? `Signed in as ${user?.name || user?.email || 'your account'}. Your reviews are saved in History.`
                    : 'Sign in to start your review and keep your analyses together.'}
                </p>
              </div>
              <div className="review-guide">
                <p className="workspace-eyebrow">A MORE CONSIDERED REVIEW</p>
                <h2>
                  From dense text to
                  <br />
                  clear next steps.
                </h2>
                <ol>
                  <li>
                    <span>01</span>
                    <div>
                      <strong>Add your document</strong>
                      <p>Upload a file or paste contract text.</p>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      <strong>Explore the details</strong>
                      <p>Read explanations beside the original clauses.</p>
                    </div>
                  </li>
                  <li>
                    <span>03</span>
                    <div>
                      <strong>Take the conversation further</strong>
                      <p>Ask questions and export a review to discuss.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </section>
            <p className="workspace-privacy">
              Document text is sent to the configured AI provider. Analyses are saved to your
              account and can be deleted from History. AI output is informational and may be wrong;
              it is not a substitute for legal advice.
            </p>

            {/* Upload Section */}
            <UploadSection
              onUpload={handleDocumentUpload}
              isProcessing={isProcessing}
              isAuthenticated={isLoggedIn}
              onAuthRequired={() => setAuthModalOpen(true)}
            />
          </div>
        )}

        {activeSection === 'history' && isLoggedIn && (
          <AnalysisHistory
            onNewDocument={handleNewDocument}
            onLoad={(analysis) => {
              setDocumentData(analysis);
              setHasDocument(true);
              setActiveSection('results');
            }}
          />
        )}
        {activeSection === 'results' && hasDocument && (
          <div className="animate-fade-in">
            <ResultsSection documentData={documentData} onNewDocument={handleNewDocument} />
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
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    1
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-3">
                  Upload Document
                </h3>
                <p className="text-accent-600 dark:text-accent-300">
                  Upload a PDF, DOC, DOCX or UTF-8 text file, or paste the document text directly.
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-3">
                  AI Analysis
                </h3>
                <p className="text-accent-600 dark:text-accent-300">
                  Our advanced AI analyzes your document, identifying key clauses, potential risks,
                  and important terms.
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    3
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-3">
                  Get Insights
                </h3>
                <p className="text-accent-600 dark:text-accent-300">
                  Receive detailed explanations, risk assessments, and actionable recommendations in
                  plain English.
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
                    <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">
                      Document Types
                    </h4>
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
                    <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">
                      Analysis Features
                    </h4>
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
                    <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">
                      Explicit sharing
                    </h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      Document text is sent to your configured AI provider for analysis
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 dark:text-blue-400 text-xl">🗑️</span>
                    </div>
                    <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">
                      File processing
                    </h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      The upload handler extracts text without saving the original file
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 dark:text-purple-400 text-xl">🔐</span>
                    </div>
                    <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">
                      Account history
                    </h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      Analyses are associated with your account. You choose when to delete them
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
                Our AI assistant is here to help you understand legal documents, answer questions,
                and provide guidance. Click the chat icon in the bottom right to start a
                conversation!
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-3">
                    What I Can Help With:
                  </h4>
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
                  <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-3">
                    How to Get Started:
                  </h4>
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
                    <h4 className="font-medium text-accent-900 dark:text-accent-100">
                      Be Specific
                    </h4>
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
                    <h4 className="font-medium text-accent-900 dark:text-accent-100">
                      Context Matters
                    </h4>
                    <p className="text-sm text-accent-600 dark:text-accent-300">
                      Provide context about your situation for better guidance
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-accent-900 dark:text-accent-100">
                      Professional Advice
                    </h4>
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
                <button onClick={() => setActiveSection('home')} className="btn-primary">
                  Upload Document
                </button>
                <button onClick={() => setIsChatOpen(true)} className="btn-secondary">
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
                  q: 'What types of documents can I upload?',
                  a: 'LegalEaseAI supports PDF, DOC, DOCX and UTF-8 TXT files, including contracts, rental agreements, terms of service, privacy policies, and other legal documents.',
                },
                {
                  q: 'Is my document data secure?',
                  a: 'Text is sent to the configured AI provider. Analysis is saved to your account history, which you can delete. Access tokens and local chat history use browser storage. Use only documents you are authorized to share and review your deployment and provider privacy settings.',
                },
                {
                  q: 'How accurate is the AI analysis?',
                  a: 'Our AI provides helpful insights and explanations, but should not replace professional legal advice. Always consult with a qualified attorney for important legal matters.',
                },
              ].map((faq, index) => (
                <div key={index} className="card p-6">
                  <h3 className="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-accent-600 dark:text-accent-300">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'contact' && (
          <section className="card p-8 max-w-3xl mx-auto space-y-5">
            <p className="workspace-eyebrow">PROJECT SUPPORT</p>
            <h1 className="text-3xl font-bold">Questions or feedback?</h1>
            <p>
              Report a bug, suggest an improvement, or review the project documentation on GitHub.
              This project does not provide a staffed legal support service.
            </p>
            <a
              className="btn-primary inline-block"
              href="https://github.com/taksh1507/LegalEaseAI/issues"
              target="_blank"
              rel="noreferrer"
            >
              Open project issues
            </a>
            <p className="text-sm text-accent-500">
              GitHub issues are public. Do not include private contracts, passwords or verification
              codes.
            </p>
            <button className="btn-secondary block" onClick={() => setActiveSection('faq')}>
              Read frequently asked questions
            </button>
          </section>
        )}
      </main>

      {/* Chat Widget - Always visible */}
      <ChatWidget
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isAuthenticated={isLoggedIn}
        userId={user?.id}
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
        onUpdate={setUser}
        onPasswordChanged={() => {
          handleLogout();
          setAnalysisError('Password changed. Please sign in with your new password.');
          setAuthMode('signin');
          setAuthModalOpen(true);
        }}
      />

      {/* Info Modals for Footer Links */}
      {activeModal && modalContent[activeModal] && (
        <InfoModal isOpen={true} onClose={handleCloseModal} title={modalContent[activeModal].title}>
          {React.createElement(modalContent[activeModal].component)}
        </InfoModal>
      )}
    </div>
  );
}

export default App;
