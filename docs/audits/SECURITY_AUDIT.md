# Security audit — LegalEaseAI

Date: 2026-11-14. Scope: authentication middleware, PostgreSQL TLS configuration and frontend build verification. This is a first remediation pass.

| Severity | Component | Remediation | Verification |
| --- | --- | --- | --- |
| High | Required authentication | Previously accepted JWT claims as a user whenever the database was unconfigured or the lookup failed. It now returns 503 and never grants access until the user is verified against the database. Deleted users remain unauthorized. | Five middleware regressions: 5 passed; original middleware failed 3 of these cases. |
| Medium | Optional authentication | Previously treated token data as a verified identity during database errors. Now remains anonymous when lookup fails. | Optional-auth regression passes. |
| Medium | PostgreSQL TLS | Removed explicit certificate-verification bypass for Neon connections. | Configuration review only; a real TLS connection was not tested. |

## Remaining risks

The dependency audit returned 37 package-level advisories in the backend and 74 in the frontend dependency tree at the time of review; these are registry results, not proof each advisory is exploitable here. Dependency upgrades remain outstanding. Inspect advisory data with `npm audit` before deployment; do not force major upgrades without compatibility checks.

PDF HTML rendering, uploads, email OTP throttling, provider API use, CORS policy, output escaping and all route-level authorization still require targeted review. The TLS correction can surface invalid certificates that were previously accepted. Database URL SSL parameters and provider certificate configuration need validation in the deployment environment.

Tests use injected local database behavior and a test-only signing key. No real database, email, provider account or live application was accessed. No credential values or production data are included.
