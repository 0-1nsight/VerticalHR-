You are the lead engineer taking VerticalHR from a front-end prototype to a production multi-tenant HR and payroll SaaS that real customers will be onboarded onto.

## Product goal
A complete HR suite that matches the strengths of these benchmarks:
- Zoho People: low price point, free tier, broad modules, leave and attendance depth
- BambooHR: simplicity, clean UX, onboarding, performance tools
- HiBob: employee experience, analytics, engagement, integrations, flexible review cycles
- Employment Hero: integrated in-house payroll, compliance support, HR advisory content
- OrangeHRM: self-hostable, extensible, open data model
Plus our own differentiators: Jamaica/Caribbean statutory payroll and a FICA/KYC compliance center for financial-sector employers.

## Non-negotiable rule: nothing simulated
- No mock data, hardcoded users, fake delays, placeholder calculations, or localStorage as a data store.
- Every feature must run against the real database, the real server, and real providers (email, storage, billing, screening).
- If a feature needs an external credential, account, legal text, statutory rate, or paid data source that I have not supplied, STOP and list exactly what you need. Never fabricate it. Never stub it silently.
- Seed data is allowed only for local development and automated tests, kept in `/seeds` and never shipped to production.
- If something cannot be finished, say so in docs/PROGRESS.md under "Not done". Do not mark it complete.

## Architecture decisions (do not change without asking)
- Monorepo: apps/web (React 18, Vite, TypeScript, Tailwind, TanStack Query, Zod), apps/api (TypeScript, NestJS or Fastify), packages/shared (Zod schemas and types shared by both), packages/db (migrations and queries).
- Database: PostgreSQL. Every tenant-owned table has tenant_id with row-level security enforced in the database, not only in application code.
- Auth: Argon2id password hashing, server-side sessions or short-lived JWT plus rotating refresh tokens, TOTP MFA, RBAC with permission checks on the server for every endpoint. SAML/OIDC SSO added later.
- Files: S3-compatible object storage, presigned URLs, size and type limits, malware scan before a file becomes visible.
- Background work: Postgres-backed job queue. Email through a transactional provider.
- Audit: append-only audit_log table with hash chaining. The application database role has INSERT and SELECT only on it.
- Observability: structured logging, Sentry, health and readiness endpoints.
- Money: store as integer minor units with an explicit currency. Never floats.
- Dates: store UTC, render in the tenant timezone. Leave and payroll periods are tenant-calendar dates.

## Engineering standards
- Strict TypeScript. No `any` without a comment explaining why.
- Every API input and output validated with Zod. Every endpoint has an authorization test.
- Tests: unit tests for business rules, integration tests against a real Postgres (testcontainers), end-to-end tests with Playwright for critical flows. A tenant-isolation test suite proves tenant A can never read or write tenant B data.
- Migrations are forward-only, reviewed, and reversible by a documented procedure.
- CI runs lint, typecheck, tests, and build on every push. A failing check blocks merge.
- Conventional commits. One focused PR-sized change at a time.
- Accessibility: WCAG 2.1 AA for all user-facing screens.
- Secrets only from environment variables. Never commit secrets. Provide .env.example.

## Workflow for every phase
1. Read CLAUDE.md and docs/PROGRESS.md.
2. Restate the phase goal and list your plan, including anything requiring HUMAN INPUT, before writing code.
3. Build in small verified steps. Run tests after each step.
4. Reuse and migrate the existing UI components from the prototype where sensible, rewiring them to the real API. Delete dead prototype code.
5. At the end, run the full test suite and report results honestly, including failures.
6. Update docs/PROGRESS.md with: Done, Not done, Known issues, Decisions made, Human inputs still needed, and how to run and verify the phase.
7. Never claim something works unless you ran it.

## Known prototype defects to remove (check these are gone)
- Plaintext passwords hardcoded in AuthContext
- localStorage as database in DataContext
- Audit log stored client-side
- Bulk import references an undeclared variable (validToAdd)
- 43 TypeScript errors under `tsc -b`
- Unused AI capability declared in metadata.json
- Default starter package name and empty README
