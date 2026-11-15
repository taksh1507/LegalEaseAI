# Security

Please do not publish active credentials, verification codes, private documents or
an exploit against a live deployment in a public issue. Use GitHub's private
vulnerability reporting on this repository if available; otherwise contact the
maintainer through a private channel listed on their GitHub profile.

## Controls implemented

- Required random JWT signing configuration; HS256 verification, one-hour expiry,
  database-backed identity checks and token-version revocation after password changes.
- Actual SMS verification; hashed, expiring, single-use email challenges with
  transactional attempt limits and payload/mode binding.
- Verified contact required for document, chat and report services; account IDs
  used for document-history ownership.
- Explicit CORS, request/file/archive limits, bounded provider timeouts and
  per-IP/per-account request limits.
- Escaped report templates, disabled report JavaScript/network access, limited
  rendering concurrency, and no client-selected filesystem output paths.
- Real database/provider failures return errors instead of invented users or analysis.

## Deployment responsibilities and limits

Rotate the previously embedded SMS provider credential before using the service.
Removing it from source does not revoke it or remove it from Git history. This
change does not rewrite history or rotate credentials in external accounts.

Use a unique random JWT_SECRET, HTTPS, restricted database access and verified TLS.
Keep all provider and database credentials in backend environment configuration,
never VITE_ or REACT_APP_ variables. The browser stores bearer credentials in
localStorage; malicious same-origin scripts or shared browser profiles can expose
them. There is no claim of encryption at rest or regulatory certification.

Email challenges are persisted in PostgreSQL. Mobile/profile challenge sessions
and rate-limit counters currently use process memory. Use a single API process;
shared challenge/rate-limit stores are required before running multiple replicas.
A restart invalidates pending process-local challenges rather than verifying them.

Keep the Chromium sandbox enabled in production. PDF_DISABLE_SANDBOX is an explicit
opt-in for isolated local/CI environments, not an automatic production fallback.
Live provider behavior, production infrastructure, historical credentials and
adversarial legacy-DOC parsing have not been comprehensively certified.

Before applying migrations to an existing database, back it up and review legacy
history ownership. The additive migration binds only unambiguous current email
identities created before the history record, and retains unmatched rows without
exposing them to accounts. Reconcile unmatched or historically reassigned email
identities manually with verified ownership; never assign them by guesswork.
