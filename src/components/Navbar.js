import React, { useState } from 'react';
import { 
  SunIcon, 
  MoonIcon, 
  Bars3Icon, 
  XMarkIcon,
  ScaleIcon 
} from '@heroicons/react/24/outline';

const Navbar = ({ darkMode, setDarkMode, activeSection, setActiveSection, onNewDocument, user, isLoggedIn, onSignIn, onSignUp, onProfileClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home' },
    { id: 'upload', label: 'Upload' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    
    if (sectionId === 'home') {
      onNewDocument();
    }
  };

  return (
    <nav className="bg-white/80 dark:bg-accent-900/80 backdrop-blur-md border-b border-accent-200 dark:border-accent-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <ScaleIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-accent-900 dark:text-accent-100">
                LegalEase<span className="text-primary-600">AI</span>
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeSection === item.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100 hover:bg-accent-100 dark:hover:bg-accent-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode Toggle & Auth Buttons */}
          <div className="flex items-center space-x-3">
            {/* Authentication Buttons */}
            {!isLoggedIn ? (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={onSignIn}
                  className="px-4 py-2 text-sm font-medium text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100 transition-colors duration-200"
                >
                  Sign In
                </button>
                <button
                  onClick={onSignUp}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <button
                onClick={onProfileClick}
                className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-700 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium">{user?.name || 'User'}</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-700 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-700 transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <Bars3Icon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-accent-900 border-t border-accent-200 dark:border-accent-700">
              {/* Mobile Brand */}
              <div className="px-3 py-2 border-b border-accent-200 dark:border-accent-700 mb-2">
                <h1 className="text-lg font-bold text-accent-900 dark:text-accent-100">
                  LegalEase<span className="text-primary-600">AI</span>
                </h1>
              </div>
              
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    activeSection === item.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100 hover:bg-accent-100 dark:hover:bg-accent-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              {/* Mobile Authentication */}
              {!isLoggedIn ? (
                <div className="mt-4 pt-4 border-t border-accent-200 dark:border-accent-700 space-y-2">
                  <button
                    onClick={() => { onSignIn(); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100 hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { onSignUp(); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors duration-200"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-accent-200 dark:border-accent-700">
                  <button
                    onClick={() => { onProfileClick(); setMobileMenuOpen(false); }}
                    className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-base font-medium text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100 hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span>{user?.name || 'User Profile'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;