import React, { useState, useEffect } from 'react';
import { 
  SunIcon, 
  MoonIcon, 
  Bars3Icon, 
  XMarkIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

const Navbar = ({ darkMode, setDarkMode, activeSection, setActiveSection, onNewDocument, user, isLoggedIn, onSignIn, onSignUp, onProfileClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const baseMenuItems = [
    { name: 'Home', section: 'home' },
    { name: 'How It Works', section: 'how-it-works' },
    { name: 'AI Help', section: 'ai-help' }
  ];

  const menuItems = baseMenuItems;

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-accent-900 shadow-lg border-b border-accent-200 dark:border-accent-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <ScaleIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <span className="ml-2 text-xl font-bold text-accent-900 dark:text-accent-100">
                LegalEase<span className="text-primary-600 dark:text-primary-400">AI</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {menuItems.map((item) => (
                  <div key={item.section} className="relative">
                    <button
                      onClick={() => handleNavClick(item.section)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                        activeSection === item.section
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100 hover:bg-accent-100 dark:hover:bg-accent-800'
                      }`}
                    >
                      <span className="whitespace-nowrap">{item.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-4">
            {/* New Document Button */}
            {activeSection === 'results' && (
              <button
                onClick={onNewDocument}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                New Document
              </button>
            )}

            {/* Authentication */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-accent-600 dark:text-accent-300">
                  Welcome, {user?.name || user?.email || 'User'}
                </span>
                <button
                  onClick={onProfileClick}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Profile
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={onSignIn}
                  className="text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sign In
                </button>
                <button
                  onClick={onSignUp}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-accent-600 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Theme Toggle Mobile */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-accent-600 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-accent-600 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-accent-900 border-t border-accent-200 dark:border-accent-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Navigation Items */}
            {menuItems.map((item) => (
              <div key={item.section}>
                <button
                  onClick={() => handleNavClick(item.section)}
                  className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    activeSection === item.section
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100 hover:bg-accent-100 dark:hover:bg-accent-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="whitespace-nowrap">{item.name}</span>
                  </div>
                </button>
              </div>
            ))}

            {/* Mobile Authentication */}
            <div className="border-t border-accent-200 dark:border-accent-700 pt-3 mt-3">
              {isLoggedIn ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-accent-600 dark:text-accent-300">
                    Welcome, {user?.name || user?.email || 'User'}
                  </div>
                  <button
                    onClick={onProfileClick}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-200"
                  >
                    Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={onSignIn}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-accent-600 dark:text-accent-300 hover:text-accent-900 dark:hover:text-accent-100 hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onSignUp}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-200"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* New Document Button Mobile */}
            {activeSection === 'results' && (
              <div className="border-t border-accent-200 dark:border-accent-700 pt-3 mt-3">
                <button
                  onClick={onNewDocument}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-200"
                >
                  New Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;