import React from 'react';
import { ScaleIcon } from '@heroicons/react/24/outline';
const groups = [
  {
    title: 'Your information',
    links: [
      ['Terms of Service', 'terms-of-service'],
      ['Privacy Policy', 'privacy-policy'],
      ['Browser Storage', 'cookie-policy'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['Project Support', 'contact'],
      ['Help Center', 'help-center'],
      ['API Documentation', 'api-documentation'],
    ],
  },
  {
    title: 'The project',
    links: [
      ['About this project', 'about-us'],
      ['Engineering notes', 'blog'],
      ['Contributing', 'careers'],
    ],
  },
];
export default function Footer({ onNavigate, onOpenModal }) {
  return (
    <footer className="bg-white dark:bg-accent-900 border-t border-accent-200 dark:border-accent-700 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg">
              <ScaleIcon className="w-7 h-7 text-primary-600" />
              LegalEaseAI
            </div>
            <p className="text-sm text-accent-500 dark:text-accent-400 mt-4 leading-7">
              A clearer workspace for understanding contracts and preparing better questions.
            </p>
            <a
              className="inline-block mt-4 text-sm text-primary-600 dark:text-primary-400"
              href="https://github.com/taksh1507/LegalEaseAI"
              target="_blank"
              rel="noreferrer"
            >
              View the project ↗
            </a>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs uppercase tracking-wider font-semibold mb-4">{group.title}</h2>
              <ul className="space-y-3 text-sm text-accent-500 dark:text-accent-400">
                {group.links.map(([label, key]) => (
                  <li key={key}>
                    <button
                      className="hover:text-primary-600 dark:hover:text-primary-300 text-left"
                      onClick={() => (key === 'contact' ? onNavigate('contact') : onOpenModal(key))}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-accent-100 dark:border-accent-800 mt-8 pt-6 flex flex-wrap gap-4 justify-between text-xs text-accent-500 dark:text-accent-400">
          <p>© {new Date().getFullYear()} LegalEaseAI · An engineering portfolio project.</p>
          <p>
            AI-assisted information, not legal advice. Confirm important decisions with qualified
            counsel.
          </p>
        </div>
      </div>
    </footer>
  );
}
