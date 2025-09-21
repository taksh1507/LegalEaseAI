import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

const ChatWidget = ({ isOpen, setIsOpen, messages, onSendMessage, isAuthenticated, onAuthRequired }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('legalease-chat-history');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save current chat to history when messages change
  useEffect(() => {
    if (messages.length > 1 && currentChatId) { // Only save if there are actual conversations
      saveChatToHistory();
    }
  }, [messages]);

  const saveChatToHistory = () => {
    if (!isAuthenticated || messages.length <= 1) return;

    const chatTitle = messages[1]?.text?.substring(0, 50) + '...' || 'New Chat';
    const chatData = {
      id: currentChatId || Date.now(),
      title: chatTitle,
      messages: messages,
      timestamp: new Date().toISOString(),
      messageCount: messages.length
    };

    const updatedHistory = chatHistory.filter(chat => chat.id !== chatData.id);
    updatedHistory.unshift(chatData);
    
    // Keep only last 20 chats
    const limitedHistory = updatedHistory.slice(0, 20);
    
    setChatHistory(limitedHistory);
    localStorage.setItem('legalease-chat-history', JSON.stringify(limitedHistory));
    
    if (!currentChatId) {
      setCurrentChatId(chatData.id);
    }
  };

  const startNewChat = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    
    // Save current chat before starting new one
    if (messages.length > 1) {
      saveChatToHistory();
    }
    
    setCurrentChatId(Date.now());
    setShowHistory(false);
    
    // Reset to initial state - this should trigger the parent to reset messages
    window.dispatchEvent(new CustomEvent('newChatRequested'));
  };

  const loadChatFromHistory = (chat) => {
    setCurrentChatId(chat.id);
    setShowHistory(false);
    
    // Load chat messages - this should trigger the parent to load these messages
    window.dispatchEvent(new CustomEvent('loadChatFromHistory', { 
      detail: { chatId: chat.id, messages: chat.messages } 
    }));
  };

  const deleteChatFromHistory = (chatId) => {
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    setChatHistory(updatedHistory);
    localStorage.setItem('legalease-chat-history', JSON.stringify(updatedHistory));
  };

  const clearAllHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('legalease-chat-history');
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    onSendMessage(inputMessage);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI typing delay
    setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const suggestedQuestions = [
    "What are the main risks in this contract?",
    "Explain the termination clause",
    "What happens if I breach this agreement?",
    "Are there any automatic renewal terms?"
  ];

  if (!isOpen) {
    // Floating Chat Button
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 group"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-accent-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Ask questions about your document
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-accent-900"></div>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-white dark:bg-accent-900 rounded-lg shadow-2xl border border-accent-200 dark:border-accent-700 flex flex-col z-50 animate-slide-up">
      {/* Chat Header */}
      <div className="p-4 border-b border-accent-200 dark:border-accent-700 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Legal Assistant</h3>
              <p className="text-xs text-primary-100">Ask questions about your document</p>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <>
                <button
                  onClick={startNewChat}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200 group"
                  title="Start New Chat"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200 group"
                  title="Chat History"
                >
                  <ClockIcon className="h-4 w-4" />
                </button>
              </>
            )}
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat History Panel */}
      {showHistory && isAuthenticated && (
        <div className="border-b border-accent-200 dark:border-accent-700 bg-accent-50 dark:bg-accent-800 max-h-48 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-accent-900 dark:text-accent-100">Chat History</h4>
              {chatHistory.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="text-xs text-danger-600 hover:text-danger-700 dark:text-danger-400"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {chatHistory.length === 0 ? (
              <p className="text-xs text-accent-600 dark:text-accent-400 text-center py-4">
                No chat history yet. Start a conversation!
              </p>
            ) : (
              <div className="space-y-2">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between p-2 hover:bg-accent-100 dark:hover:bg-accent-700 rounded cursor-pointer group"
                    onClick={() => loadChatFromHistory(chat)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-accent-900 dark:text-accent-100 truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-accent-600 dark:text-accent-400">
                        {new Date(chat.timestamp).toLocaleDateString()} • {chat.messageCount} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChatFromHistory(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-danger-600 hover:text-danger-700 dark:text-danger-400"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full w-fit mx-auto mb-3">
              <SparklesIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-accent-600 dark:text-accent-400 mb-4">
              Hi! I'm here to help you understand your legal document. Ask me anything!
            </p>
            
            {/* Suggested Questions */}
            <div className="space-y-2">
              <p className="text-sm text-accent-500 dark:text-accent-400">Try asking:</p>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="block w-full text-left p-2 text-sm bg-accent-100 dark:bg-accent-800 hover:bg-accent-200 dark:hover:bg-accent-700 rounded-lg transition-colors duration-200"
                >
                  "{question}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${
                  message.sender === 'user' 
                    ? 'chat-bubble-user' 
                    : 'chat-bubble-ai'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.sender === 'user' ? 'text-primary-100' : 'text-accent-500 dark:text-accent-400'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="chat-bubble-ai">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-accent-200 dark:border-accent-700">
        {!isAuthenticated && (
          <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
              Please sign in to start chatting with LegalEaseAI
            </p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isAuthenticated ? "Ask about clauses, risks, or anything else..." : "Sign in to start chatting..."}
            className="flex-1 resize-none px-3 py-2 border border-accent-300 dark:border-accent-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 placeholder-accent-500 dark:placeholder-accent-400 text-sm"
            rows={1}
            disabled={!isAuthenticated}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isAuthenticated}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              inputMessage.trim() && isAuthenticated
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-accent-200 dark:bg-accent-700 text-accent-400 dark:text-accent-500 cursor-not-allowed'
            }`}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-xs text-accent-500 dark:text-accent-400 mt-2">
          {isAuthenticated
            ? "Press Enter to send • AI responses are for guidance only"
            : "Sign in to chat with our AI assistant about legal documents"
          }
        </p>
      </div>
    </div>
  );
};

export default ChatWidget;