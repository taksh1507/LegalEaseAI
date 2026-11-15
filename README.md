# LegalEaseAI

[![Application verification](https://github.com/taksh1507/LegalEaseAI/actions/workflows/backend-security-tests.yml/badge.svg)](https://github.com/taksh1507/LegalEaseAI/actions/workflows/backend-security-tests.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A full-stack workspace for reading contracts, understanding individual clauses, asking follow-up questions, and exporting a review. Built with **React 18, Vite, Express 5, PostgreSQL, and OpenRouter**.

![LegalEaseAI workspace](docs/assets/workspace-desktop.png)

## What works

- Upload PDF, DOCX, DOC, or UTF-8 TXT files up to 10 MB, or paste text. Analysis accepts up to 60,000 characters and rejects oversized input rather than silently truncating it.
- Review the summary, quoted clauses, explanations, provider-assessed risks, and recommendations. Quoted original clauses must occur in the submitted document.
- Ask questions with the current analysis as context. Provider outages produce actionable errors instead of fabricated successful responses.
- Search, reopen, delete, and paginate saved analyses. History belongs to account IDs, so changing or reclaiming an email does not transfer another user's documents.
- Download a text summary or create a browser PDF or server-rendered report. Report rendering escapes supplied text, blocks external network requests, and bounds concurrency.
- Email verification, password sign-in, SMS verification, profile changes, and password-change token revocation. Paid analysis/chat/report endpoints require a verified contact.
- Responsive light/dark interface, keyboard-operable dialogs, loading/error states, and explicit data-flow information.

<details>
<summary>View an analysis on desktop and mobile</summary>

![Desktop analysis](docs/assets/review-desktop.png)
<img src="docs/assets/review-mobile.png" alt="Mobile analysis with clause details and risk summary" width="320" />

Screenshots come from the production-build browser suite with synthetic documents and an explicitly mocked AI provider. They do not demonstrate legal accuracy or live provider availability.
</details>

## Run locally

Use **Node.js 22.12+**, PostgreSQL 16+, npm, and Chromium/Chrome (or Puppeteer's installed browser). PostgreSQL is required for authentication and saved data.

```bash
npm ci --ignore-scripts
npm --prefix backend ci --ignore-scripts
cp .env.example .env
cp backend/.env.example backend/.env
```

Configure `backend/.env` before starting:

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | Your PostgreSQL connection; enable verified TLS for hosted databases |
| `JWT_SECRET` | Unique random value of at least 32 characters; no fallback is accepted |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Real email verification delivery |
| `OPENAI_ROUTER_KEY`, `OPENROUTER_MODEL` | AI provider credential and model |
| `TWOFACTOR_API_KEY` | Required for SMS features; rotate the credential previously embedded in source |
| `PUPPETEER_EXECUTABLE_PATH` | Path to an installed Chromium/Chrome when install scripts were skipped |
| `CORS_ORIGINS` | Exact allowed browser origins |

The root `.env` contains only the public `VITE_API_URL`. Never place provider keys or signing/database secrets in frontend environment variables. See [all API settings](backend/.env.example).

```bash
# For existing data, back up and review the migration/ownership notes first.
npm --prefix backend run db:migrate
npm run dev
```

Open `http://localhost:3000`; the API defaults to `http://localhost:5000`. Sign up using an email address you control. Missing email, SMS, or AI configuration returns a service-unavailable error; there is no demo authentication bypass. The API refuses startup without signing/database/schema configuration.

For a production bundle, use `npm run build` (output: `build/`). Deployment and production migration are manual: follow [DEPLOYMENT.md](DEPLOYMENT.md).

## Architecture

```mermaid
flowchart LR
    Browser[React + Vite] --> API[Express API]
    API --> Auth[JWT + verified contact + rate limits]
    Auth --> Parser[Bounded document parsers]
    Parser --> AI[OpenRouter]
    Auth --> PG[(PostgreSQL)]
    Auth --> Delivery[SMTP / 2Factor]
    Auth --> PDF[Isolated Chromium report renderer]
```

`src/components` contains the review/history/auth UI. `backend/app.js` assembles the testable HTTP application; `backend/index.js` validates configuration and manages startup/shutdown. Routes delegate authentication, extraction, AI, and report work to services. PostgreSQL stores users, hashed email challenges, saved analyses, and conversations. Browser chat also has an account-scoped local cache.

The API uses parameterized SQL, account ownership checks, one-hour HS256 JWTs, bcrypt password hashes, bounded OTP attempts, explicit CORS, request limits, and safe error responses. Email challenges are bound to the original signup payload and consumed once in a transaction. Password changes increment a stored token version. See [SECURITY.md](SECURITY.md) for controls and remaining limitations.

### Main API routes

| Method / path | Behavior |
| --- | --- |
| `GET /health`, `GET /ready` | Liveness and database/schema readiness |
| `POST /api/auth/send-otp`, `/api/auth/verify-otp` | Email signup/sign-in challenge flow |
| `POST /api/auth/login-email` | Password sign-in |
| `GET /api/auth/profile` | Current authenticated account |
| `POST /api/document/analyze-file`, `/api/document/analyze-text` | Verified-account document analysis |
| `POST /api/chat` | Verified-account contextual chat |
| `GET/POST/DELETE /api/document-history` | Account-owned history |
| `POST /api/pdf/generate` | Verified-account formatted PDF |

Protected routes accept `Authorization: Bearer <token>`. See route modules for individual request schemas; never log that header or document contents.

## Verification

```bash
npm run lint
npm --prefix backend test
npm run build
npm audit --audit-level=low
npm --prefix backend audit --audit-level=low
```

Integration and browser tests require a **disposable loopback database whose name ends in `_test`**. They reset its schema and refuse to run without explicit authorization. Never use application data. Run the two suites sequentially if they share a database.

```bash
export TEST_DATABASE_URL=postgresql://test_user:test_password@127.0.0.1:5432/legalease_test
export ALLOW_TEST_DATABASE_RESET=1
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium
# Only if an isolated test container cannot support Chromium's sandbox:
export PDF_DISABLE_SANDBOX=true
npm --prefix backend run test:integration
npm run test:e2e
```

The checked-in browser harness serves a real production build, real Express routes, and PostgreSQL with test-only email/SMS/AI adapters. CI runs the same flows with PostgreSQL 16. The final implementation report records **15 unit tests, 24 integration tests, and 6 browser tests** covering desktop, tablet, and mobile, plus lint/build and dependency checks. See [verification evidence and limits](docs/audits/FINAL_IMPLEMENTATION_REPORT.md).

## Engineering decisions and limits

- Vite replaces the obsolete Create React App toolchain. Report tools load on demand; the measured initial JS entry decreased from 900.34 KB to 272.72 KB (gzip 255.95 KB to 73.82 KB), using the same Vite build before and after splitting. This is an entry-bundle measurement, not total transferred code or a universal speed benchmark.
- History ownership uses immutable user IDs. An additive, one-time migration preserves unmatched legacy records; review ambiguous ownership before production rollout.
- Mobile/profile challenges and rate counters remain in memory. Run one API process until these move to a shared store; restarting invalidates those pending challenges.
- Bearer tokens and account-scoped chat caches use browser local storage. Use trusted devices; an HTTP-only cookie/session design would require a separate CSRF/session migration.
- No live email/SMS/AI accounts, production TLS/hosting, or deployed browser sandbox were validated. Legacy DOC extraction is wired but lacks a positive binary fixture test. Scanned PDFs require OCR, which is not implemented.
- AI output can be wrong and is information for review, not legal advice. Document text is sent to the configured provider. Review provider retention and privacy terms before submitting sensitive material.

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Deployment](DEPLOYMENT.md) · [MIT license](LICENSE)
