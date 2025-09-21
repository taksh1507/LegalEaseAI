import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const InfoModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-accent-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-900">
          <h2 className="text-2xl font-bold text-accent-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent-100 dark:hover:bg-accent-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-accent-500 dark:text-accent-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-white dark:bg-accent-900">
          <div className="text-accent-900 dark:text-accent-100">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-accent-200 dark:border-accent-700 p-6 flex justify-end bg-white dark:bg-accent-900">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;