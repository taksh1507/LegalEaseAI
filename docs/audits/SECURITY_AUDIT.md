# Security review — LegalEaseAI

Review dates: 2026-11-14–15. Scope: application source, dependencies, local
PostgreSQL workflows, document parsing and browser report rendering. This is a
code review and regression-tested remediation, not a penetration-test certificate.
No live account credentials or private documents were used.

| Confirmed issue | Implemented remediation | Regression evidence |
| --- | --- | --- |
| Database outage could trust an unverified JWT identity | Fail closed; required DB identity, HS256, expiry and token-version checks | Unit and API auth tests |
| Email fallback / SMS acceptance could bypass real verification | Real provider verification, no mock-success fallback; hashed email challenges, attempts/expiry/payload binding and transactional consumption | Replay, expiry, wrong mode/payload, concurrency and provider-failure tests |
| Embedded SMS provider credential | Removed from current source; backend environment variable | Configuration/no-fallback tests; external rotation remains required |
| Profile contact substitution / legacy mutation | Bind new value to challenge; require verified change route | Contact substitution and legacy update tests |
| Email-based history ownership | Account-ID storage and query predicates, guarded legacy backfill | Cross-account and email-reclaim tests |
| Password changes left tokens usable | Increment stored token version on password change | Old-token rejection and new-login tests |
| Fabricated AI fallback and broken chat persistence | Explicit provider errors; structured validation/source-quote checks; atomic owned messages | Outage, invalid output, quote and chat isolation tests |
| Unbounded/misidentified uploads | Signature/type/size validation, bounded expanded DOCX archives | TXT/PDF/DOCX extraction and malformed/limit tests |
| Report HTML and output options were unsafe | Escaping, option allowlist, no filesystem output path, no renderer JS/network | XSS/path rejection and readable PDF tests |
| Disabled hosted DB certificate verification | Verified TLS configuration and safe startup | Configuration review; production TLS remains unverified |
| Obsolete/vulnerable dependency tree | Vite toolchain migration, remove duplicate/unused packages, security upgrades and lockfiles | Reproducible installs/build; zero advisories reported by both final npm audits |

## Defense in depth

Explicit allowed origins, Helmet, request/account rate limits, body and file
bounds, provider/database/render timeouts, bounded PDF concurrency, mandatory
startup configuration and generic private-data-free server errors are in place.
Protected AI/report routes require a verified account contact. Browser requests
now include auth headers and remove stale private UI after logout/expiry.

## Required operator follow-through

1. Rotate the old SMS key at the provider. The removed credential can still exist
   in Git history; this change neither rewrites history nor revokes external keys.
2. Review and back up legacy data before the explicit migration. Current-email
   backfill cannot establish every historical reassignment; reconcile questionable
   ownership manually rather than exposing unassigned records.
3. Configure real SMTP/SMS/AI accounts, HTTPS, database TLS and a sandbox-capable
   renderer host. Keep `PDF_DISABLE_SANDBOX=false` in production.
4. Retain one API process until mobile/profile challenges and rate counters move
   to shared, bounded stores. Email challenges are persisted in PostgreSQL.

Bearer tokens and chat caches remain in browser local storage. Same-origin XSS or
shared browser profiles can expose them. No claim of encryption at rest,
regulatory certification, legal accuracy, live provider availability, exhaustive
parser hardening or production readiness is made. Scanned-PDF OCR and a positive
legacy-DOC fixture remain outside verified behavior. See the implementation report
for exact tests, and SECURITY.md for responsible reporting guidance.
