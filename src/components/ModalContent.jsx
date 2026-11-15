import React from 'react';
const repository = 'https://github.com/taksh1507/LegalEaseAI';
const ProjectLink = () => (
  <a className="text-primary-600 underline" href={repository} target="_blank" rel="noreferrer">
    Project repository and documentation
  </a>
);
export const TermsOfServiceContent = () => (
  <div className="space-y-4">
    <p>
      LegalEaseAI is an educational software project for exploring AI-assisted document review. Its
      output is informational, may be incomplete or wrong, and does not establish an attorney-client
      relationship.
    </p>
    <p>
      Upload only documents you are authorized to share with the deployment operator and its
      configured AI provider. Review important decisions with a qualified legal professional.
    </p>
    <p>
      Availability depends on the configured database, email, SMS and AI services. No accuracy,
      response-time or uptime guarantee is made.
    </p>
    <ProjectLink />
  </div>
);
export const PrivacyPolicyContent = () => (
  <div className="space-y-4">
    <p>
      Document text and questions are sent through this application's API to the configured AI
      provider. Review that provider's retention and privacy settings before sharing sensitive
      information.
    </p>
    <p>
      Completed analyses are saved in account history in the configured PostgreSQL database. You can
      delete individual analyses or clear your history. Original uploaded file buffers are used for
      text extraction and are not deliberately written to disk by the upload handler.
    </p>
    <p>
      The browser stores the access token, account details, theme preference and account-scoped
      local chat history. Shared browser profiles and malicious scripts can expose browser storage.
      Log out and use a trusted device.
    </p>
    <p>
      Encryption, backups and retention depend on the actual deployment; this project does not claim
      certification or universal encryption at rest.
    </p>
  </div>
);
export const CookiePolicyContent = () => (
  <div className="space-y-4">
    <p>
      The application uses localStorage for session credentials, preferences and account-scoped
      local chat history. It does not require an analytics or advertising cookie integration.
    </p>
    <p>
      Clearing site data removes local preferences and chat history and signs you out. Server-side
      analysis history is separate and can be deleted from History.
    </p>
  </div>
);
export const AboutUsContent = () => (
  <div className="space-y-4">
    <p>
      LegalEaseAI is maintained as a software engineering project by Taksh Gandhi. It combines a
      React interface, an authenticated Express API, PostgreSQL-backed history and configurable
      AI-assisted analysis.
    </p>
    <p>
      The project focuses on explainable workflows, clear failure states, meaningful tests and
      maintainable security controls.
    </p>
    <ProjectLink />
  </div>
);
export const BlogContent = () => (
  <div className="space-y-4">
    <p>
      Engineering notes, architecture decisions, verification results and limitations are recorded
      in the repository. No external publication archive is claimed.
    </p>
    <ProjectLink />
  </div>
);
export const CareersContent = () => (
  <div className="space-y-4">
    <p>
      This is a portfolio project, not a company recruitment portal. No job openings or hiring
      process are advertised.
    </p>
    <p>
      To discuss an engineering improvement, use the contribution guide and public project issues
      without including confidential documents.
    </p>
    <ProjectLink />
  </div>
);
export const HelpCenterContent = () => (
  <div className="space-y-4">
    <p>
      Sign in, upload a PDF, Word document or UTF-8 text file, or paste text. File uploads are
      limited to 10 MB, expanded Word archives to 20 MB, and analysis text to the API's configured
      character limit (60,000 by default).
    </p>
    <p>
      Review the original clauses alongside explanations. Open History to revisit or delete saved
      analyses. Use the report preview to export a PDF.
    </p>
    <p>
      If a provider or database is unavailable, the application reports an error rather than
      inventing a successful analysis. Retry later or check the deployment configuration.
    </p>
    <ProjectLink />
  </div>
);
export const ApiDocumentationContent = () => (
  <div className="space-y-4">
    <p>
      The Express API exposes liveness at <code>/health</code> and database readiness at{' '}
      <code>/ready</code>. Protected routes require an expiring Bearer token.
    </p>
    <ul className="list-disc pl-6 space-y-2">
      <li>
        <code>/api/auth</code>: password sign-in, verified email/mobile signup and profile changes.
      </li>
      <li>
        <code>/api/document</code>: validated file or text analysis.
      </li>
      <li>
        <code>/api/chat</code>: document-aware responses and owned conversations.
      </li>
      <li>
        <code>/api/document-history</code>: owned, paginated and searchable saved analyses.
      </li>
      <li>
        <code>/api/pdf</code>: escaped HTML previews and isolated report rendering.
      </li>
    </ul>
    <ProjectLink />
  </div>
);
