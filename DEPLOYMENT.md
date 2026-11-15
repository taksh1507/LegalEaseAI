# Deployment guide

Deployment is manual. The CI workflow builds and tests; it does not publish the
frontend, migrate a production database, merge a PR or create a release.

## Frontend

Build with Node.js 22.12+:

```bash
npm ci --ignore-scripts
VITE_API_URL=https://your-api.example npm run build
```

Serve the resulting `build/` directory using a static host. For a subdirectory,
set `BASE_PATH=/your-subdirectory/` during the build. The old
`REACT_APP_API_URL` name remains accepted for migration, but `VITE_API_URL` is
preferred. No provider keys, JWT secrets or database credentials belong in browser
configuration. The React application has no server-side rendering requirement.

Configure HTTPS and suitable host security headers, including a content-security
policy whose `connect-src` permits only your actual API. Verify local/browser PDF
exports with that policy before rollout. Test the real origin, not only localhost.

## API and database

1. Provision restricted PostgreSQL access and set `backend/.env` or host-managed
   environment variables using `backend/.env.example` as the reference.
2. Generate a unique, random `JWT_SECRET` of at least 32 characters. Configure email/SMS and
   OpenRouter only with credentials you own.
3. Back up existing data. Review `backend/database/auth_challenges.sql` and legacy
   history ownership before the explicit `npm --prefix backend run db:migrate`.
   Migrations add columns/tables and preserve rows; ambiguous history records are
   retained for verified reconciliation, not guessed ownership.
4. Run `npm --prefix backend ci` to install the API and Puppeteer's browser, or use
   `--ignore-scripts` and supply an installed Chromium path through
   `PUPPETEER_EXECUTABLE_PATH`.
5. Keep the browser sandbox enabled. Verify OS sandbox support, resource limits,
   and browser availability on the actual host. `PDF_DISABLE_SANDBOX=true` is for
   isolated local/CI environments and is not the production default.
6. Set `HOST=0.0.0.0` only when the deployment's container/proxy architecture needs
   it. The default binds to loopback. Put the API behind HTTPS and set the exact
   `CORS_ORIGINS`. Configure `TRUST_PROXY_HOPS` only for your real proxy chain.
7. Start with `npm --prefix backend start`. Startup fails when mandatory signing
   or database/schema configuration is missing. Verify `/health` (liveness),
   `/ready` (database/schema readiness) and real authenticated workflows.

The documented configuration supports a single API process. Plan and validate
shared application state before adding replicas.

## Verification before rollout

Test actual email delivery and single-use verification, SMS verification, database
TLS, AI model/provider output, authorization, uploads, both PDF generators, logout
and password-change revocation. Local and CI suites mock external providers; they
do not establish real account configuration, provider privacy behavior, legal
accuracy or production infrastructure readiness.
