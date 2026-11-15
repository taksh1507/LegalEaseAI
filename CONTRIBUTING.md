# Contributing

Use Node.js 22.12+ and PostgreSQL 16+. Keep changes focused and preserve the
existing API contracts unless a security or correctness fix requires a documented
change. Never commit real credentials, document contents or generated test traces.

```bash
npm ci --ignore-scripts
npm --prefix backend ci --ignore-scripts
npm run lint
npm --prefix backend test
npm run build
```

Run database and browser tests only with a disposable, loopback PostgreSQL database
whose name ends in `_test`. The suites intentionally reset that database schema
and refuse to run without explicit `ALLOW_TEST_DATABASE_RESET=1`. See the README
for the full environment and commands. Never point those suites at application or
production data. Run integration and browser suites sequentially when sharing a
test database.

Add behavior-focused regression tests for bugs. Keep provider fixtures explicitly
in tests; do not introduce mock-authentication or fabricated-analysis fallbacks
into application services. Test unavailable providers as well as successful paths.

Use the existing two-space, semicolon and single-quote conventions. Keep SQL
parameterized, response data owner-scoped, and error logs free of document text,
passwords, tokens, codes and connection URLs. Review migration compatibility and
unmatched legacy ownership before applying schema changes to existing data.

A useful PR explains the concrete bug or behavior, implementation, actual checks,
and anything unverified. Deployment and production migration decisions remain
separate from code review.
