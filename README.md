# LegalEaseAI — AI-Powered Legal Document Analyzer

LegalEaseAI is a responsive, professional full-stack web application that allows users to upload complex legal documents (PDF/Word/Text) and receive AI-generated summaries, clause-by-clause explanations, risk detection (red flags), and chat widget interaction powered by an LLM (Gemini / OpenRouter).

---

## Key Features

- 📄 **Document Upload**: Support for PDF and DOCX file processing, or pasting text directly.
- 🤖 **AI-Powered Analysis**: Delivers comprehensive summaries, clause-by-clause breakdowns (risk levels, plain-English explanations), and favorability assessments.
- ⚠️ **Red Flag Detection**: Identifies potentially problematic terms with actionable recommendations and consequences.
- 💬 **AI Chat Assistant**: Interactive contextual chat assistant allowing users to ask questions about uploaded agreements.
- 🌙 **Modern Premium UI**: Built with responsive layouts, dark/light theme support, smooth micro-animations, and full-screen preview modals.

---

## Tech Stack

### Frontend
- **Framework**: React.js 18
- **Styling**: Tailwind CSS 3.3
- **Animations**: Framer Motion
- **Icons**: Heroicons
- **Helper Tools**: `jspdf` & `html2canvas` (for document preview and PDF generation)

### Backend
- **Framework**: Node.js & Express
- **LLM Integrations**: 
  - **Google Gemini (Direct SDK)**: Supports **Gemini 1.5 Flash** (recommended for speed & cost) and **Gemini 1.5 Pro** (for advanced analysis & reasoning).
  - **OpenRouter (API)**: Supports unified integration with models like **OpenAI GPT-4o-mini**, **GPT-4o**, and **Meta Llama 3**.
- **Database**: PostgreSQL (Neon Serverless)
- **Authentication**: Email OTP verification (with temporary local storage token validation)
- **File Parsing**: `pdf-parse` (PDF) and `mammoth` (DOCX Word docs)

---

## Project Structure

```text
LegalEaseAI/
├── src/                    # React Frontend Code
│   ├── components/         # Reusable UI Components
│   │   ├── ChatWidget.js        # Floating AI chat assistant
│   │   ├── ClauseAccordion.js   # Clause-by-clause risk breakdown
│   │   ├── Footer.js            # Footer with disclaimers
│   │   ├── EnhancedAuthModal.js # OTP & password-based sign-in/up
│   │   ├── InfoModal.js         # Informational policy modals
│   │   ├── ModalContent.js      # Terms, privacy, cookie policy content
│   │   ├── Navbar.js            # Navigation bar with dark mode toggle
│   │   ├── PDFPreviewModal.js   # PDF viewer modal
│   │   ├── PDFTemplate.js       # Printable layout template
│   │   ├── RedFlagSidebar.js    # Sidebar showing severity indicators
│   │   ├── ResultsSection.js    # Multi-tab analysis results panel
│   │   ├── SummaryCard.js       # Executive summary & key points card
│   │   └── UploadSection.js     # Drag-and-drop file uploader
│   ├── services/           # Frontend Client Services
│   │   ├── BackendPDFAPI.js     # PDF export backend caller
│   │   └── PDFService.js        # PDF design and generator helper
│   ├── App.js              # Application entry, state & routes
│   ├── index.js            # React mounting hook
│   └── index.css           # Styling overrides & Tailwind declarations
│
├── backend/                # Node.js Express Backend Code
│   ├── config/             # Config variables (Postgres Pool)
│   ├── controllers/        # Express route controllers (auth, history)
│   ├── database/           # DB schema initialization
│   ├── middleware/         # Auth verification middleware
│   ├── migrations/         # PostgreSQL table creation scripts
│   ├── routes/             # API routes (auth, chat, document, pdf)
│   ├── services/           # Service layer (AI, email, OTP generation)
│   ├── utils/              # Helper utilities (chunking, prompts)
│   ├── index.js            # Express entry point
│   └── package.json        # Backend dependencies
│
└── package.json            # Root configuration
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: (v18+ recommended)
- **PostgreSQL**: (Optional; required for database history features)

### 2. Environment Setup

Create a `.env` file inside the `backend` directory based on `backend/.env.production.template`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_postgresql_database_url
JWT_SECRET=your_jwt_secret_key
SMTP_USER=your_gmail_address
SMTP_PASS=your_gmail_app_password

# LLM API Keys (Provide at least one)
OPENAI_ROUTER_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 3. Installation & Start

From the root directory of the project, run:

1. **Install all dependencies** (installs both root, frontend, and backend packages):
   ```bash
   npm run install-all
   ```

2. **Start the development server** (runs both frontend and backend concurrently):
   ```bash
   npm run dev
   ```
   - Frontend runs on: `http://localhost:3000`
   - Backend runs on: `http://localhost:5000`

---

## API Endpoints

- **Auth**: `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`
- **Analysis**: `POST /api/document/analyze-file`, `POST /api/document/analyze-text`
- **Chat**: `POST /api/document/chat`
- **History**: `GET /api/document-history`
- **PDF Generation**: `POST /api/pdf/generate`

---

## Legal Considerations

⚠️ **Disclaimer**: LegalEaseAI provides AI-generated analysis for educational and helper purposes only. It does not constitute professional legal advice and should not replace consultation with qualified legal counsel.