import React from 'react';
import { ScaleIcon, HeartIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    legal: [
      { name: 'Terms of Service', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Cookie Policy', href: '#' }
    ],
    support: [
      { name: 'Contact Us', href: '#' },
      { name: 'Help Center', href: '#' },
      { name: 'API Documentation', href: '#' }
    ],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' }
    ]
  };

  return (
    <footer className="bg-white dark:bg-accent-900 border-t border-accent-200 dark:border-accent-700 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <ScaleIcon className="h-8 w-8 text-primary-600" />
              <h3 className="text-xl font-bold text-accent-900 dark:text-accent-100">
                LegalEase<span className="text-primary-600">AI</span>
              </h3>
            </div>
            <p className="text-accent-600 dark:text-accent-400 text-sm leading-relaxed mb-4">
              Simplifying legal documents with AI-powered analysis, making complex contracts 
              understandable for everyone.
            </p>
            <div className="flex items-center space-x-1 text-sm text-accent-500 dark:text-accent-400">
              <span>Made with</span>
              <HeartIcon className="h-4 w-4 text-red-500" />
              <span>for legal clarity</span>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-accent-900 dark:text-accent-100 mb-4 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-accent-100 text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold text-accent-900 dark:text-accent-100 mb-4 uppercase tracking-wider">
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-accent-100 text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-accent-900 dark:text-accent-100 mb-4 uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-accent-100 text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="border-t border-accent-200 dark:border-accent-700 pt-8 mb-8">
          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-6">
            <h5 className="text-sm font-semibold text-warning-800 dark:text-warning-300 mb-2">
              ⚠️ Important Legal Disclaimer
            </h5>
            <p className="text-warning-700 dark:text-warning-400 text-sm leading-relaxed">
              <strong>This tool is not legal advice.</strong> LegalEaseAI provides AI-powered analysis 
              and explanations for educational purposes only. The information provided should not be 
              considered as legal advice or a substitute for consultation with qualified legal professionals. 
              Always consult with an attorney for specific legal matters and before making important legal decisions.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-accent-200 dark:border-accent-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-accent-500 dark:text-accent-400">
              © {currentYear} LegalEaseAI. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-accent-500 dark:text-accent-400">
              <span>Powered by AI</span>
              <span>•</span>
              <span>Secure & Private</span>
              <span>•</span>
              <span>No Legal Advice</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;