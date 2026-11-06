# VerticalHR Production Build Prompt Pack

A master prompt plus one prompt per phase, for turning the VerticalHR prototype into a production multi-tenant HR suite. Paste the **Master Prompt** once at the start of a session (or save it as `CLAUDE.md` in the repo root), then run the phase prompts in order. Do not start a phase until the previous one passes its acceptance criteria.

## How to use this pack

1. Save the Master Prompt as `CLAUDE.md` at the repo root so every session loads it.
2. Create `docs/PROGRESS.md` (the Master Prompt tells the agent to maintain it).
3. Run Phase 0, review the diff and run the tests yourself, then merge.
4. Start each later phase in a fresh session. The agent reads `CLAUDE.md` and `docs/PROGRESS.md` to pick up context.
5. When a phase says **HUMAN INPUT REQUIRED**, supply the item before continuing. The agent must stop and ask rather than invent it.

---

## Master Prompt (save as CLAUDE.md)

```
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
```

---

## Phase 0: Foundation and cleanup

```
Execute Phase 0.

Goal: a clean monorepo with a real database, real authentication, tenancy, audit, storage, email and CI. No product features yet.

Deliverables:
1. Restructure into the monorepo layout in CLAUDE.md. Move the prototype UI into apps/web. Fix every TypeScript error so `tsc` is clean, and fix the bulk-import bug.
2. Postgres schema and migrations for: tenants, users, memberships, roles, permissions, sessions, audit_log, files. Row-level security policies on every tenant table, with a test proving isolation.
3. Auth: register/login/logout, Argon2id, email verification, password reset, TOTP MFA with recovery codes, session management, login rate limiting and lockout.
4. RBAC: roles super_admin, hr_admin, hr_manager, line_manager, supervisor, employee, auditor, mapped to explicit permissions. A single server-side permission check used by every endpoint, and a matching client-side hook for hiding UI only.
5. Audit service: every write goes through it. Hash-chained rows. A verification command that detects tampering. The app DB role cannot UPDATE or DELETE audit rows.
6. File service: presigned upload and download, type and size limits, malware scanning step, per-tenant key prefixes.
7. Email service with templates, a queue, retries and delivery logging.
8. Tenant signup flow that creates a tenant and first admin.
9. Docker Compose for local dev, GitHub Actions CI, health endpoints, Sentry wiring, structured logs.
10. A real README with setup instructions, plus .env.example.

HUMAN INPUT REQUIRED: email provider API key, S3-compatible storage credentials, Sentry DSN, and your preferred cloud target for later deployment.

Acceptance criteria: a new tenant can sign up, verify email, enable MFA, invite a user, and every action appears in a verifiable audit chain. Tenant isolation tests pass. CI is green. No localStorage data store remains.
```

---

## Phase 1: Core HR, documents and self-service

```
Execute Phase 1. This is the Zoho and BambooHR baseline.

Goal: replace the prototype's employee, department, document and approval screens with real, API-backed functionality.

Deliverables:
1. Employee records: personal, employment, job history, qualifications, emergency contacts, bank details (field-level encryption for bank and tax IDs), custom fields per tenant.
2. Org structure: departments, positions, reporting lines, org chart generated from real data, effective-dated changes.
3. Employee lifecycle: hire, probation, transfer, promotion, termination with an exit checklist. Career movements stored with effective dates.
4. Document vault: categories, versioning, expiry reminders, per-document access rules, e-acknowledgement of policies with timestamps.
5. Profile change requests with a configurable approval workflow. A generic workflow engine (steps, approvers, delegation, escalation timers) that later phases reuse.
6. Employee self-service portal: view and request changes to own data, download letters.
7. HR letter generator producing real PDFs from tenant-editable templates with merge fields.
8. CSV/XLSX import and export with a validation preview, row-level error report and rollback of a failed import. Include migration mappers for BambooHR, Zoho People and OrangeHRM export formats.
9. Reports: headcount, turnover, tenure, demographics with saved filters and CSV export.
10. In-app and email notifications with per-user preferences.

Acceptance criteria: an HR admin can import a real 500-row employee file, see it validated, commit it, and every change is audited. Field-level encryption is verified by inspecting the database. Playwright covers hire to termination.
```

---

## Phase 2: Leave management

```
Execute Phase 2.

Goal: production-grade leave with real accrual rules.

Deliverables:
1. Leave types with rules: accrual method (monthly, anniversary, upfront), carry-over caps and expiry, negative balance policy, half-day and hourly units, proof-of-document requirements, gender or tenure eligibility.
2. Accrual engine as a scheduled job. It is idempotent, recorded as ledger entries (never a mutable balance), and fully re-computable.
3. Public holidays and company calendars per tenant and per location, plus work-week patterns. HUMAN INPUT REQUIRED: the Jamaican public holiday list for the target years, confirmed from an official source.
4. Requests with overlap and balance validation, manager and HR approval through the Phase 1 workflow engine, cancellation and amendment.
5. Team calendar, who-is-out view, and blackout periods.
6. Balances, ledger history and an adjustment screen with mandatory reason, all audited.
7. Leave reports and payroll-ready leave summaries.

Acceptance criteria: unit tests cover accrual edge cases (mid-month hire, carry-over expiry, leap years, unpaid leave). Recomputing balances from the ledger reproduces stored balances exactly.
```

---

## Phase 3: Time and attendance

```
Execute Phase 3.

Goal: real time capture usable from a phone.

Deliverables:
1. Installable PWA with offline punch queue that syncs safely and idempotently.
2. Clock in/out with optional geofencing (real GPS check against configured work sites) and optional selfie capture, configurable per tenant and per employee group.
3. Shifts, rosters, shift swaps, open shifts and schedule publishing with notifications.
4. Overtime and pay-policy rules: daily and weekly thresholds, multipliers, break deductions, rounding rules. Rules are configuration, not code.
5. Timesheets with project or task coding, submit and approve flow, lock after payroll close.
6. Exceptions queue: missed punches, late arrivals, out-of-geofence punches.
7. Attendance and utilisation reports.

Acceptance criteria: a punch made offline syncs once and only once. Overtime calculations match hand-computed test cases written with a payroll specialist. Locked periods cannot be edited without an audited reopen.
```

---

## Phase 4: Jamaican payroll

```
Execute Phase 4. This is the highest-risk phase. Accuracy matters more than speed.

Goal: a payroll engine that can pay real employees in Jamaica.

HUMAN INPUT REQUIRED before coding the rules: current statutory rates, thresholds, caps and filing formats for PAYE, NIS, NHT, Education Tax and HEART/NTA, sourced from Tax Administration Jamaica and the relevant agencies, plus at least 20 worked example payslips from a qualified Jamaican payroll practitioner. Do not guess any rate. Put every rate in an effective-dated configuration table, not in code.

Deliverables:
1. Pay elements: salary, hourly, allowances, bonuses, commissions, benefits in kind, one-off and recurring deductions, loans, garnishments, pension contributions.
2. Effective-dated statutory rule engine with year-end threshold changes and the ability to run a past period with the rules in force at that time.
3. Pay run lifecycle: draft, calculate, review with variance report, approve (two-person rule), finalize, lock, reverse and correct. Every step audited.
4. Payslips as PDFs, delivered in the employee portal and by email.
5. Bank payment file generation in the format required by the tenant's bank. HUMAN INPUT REQUIRED: the bank file specifications.
6. Statutory return exports (for example monthly statutory deductions and annual employer returns) in the official formats. HUMAN INPUT REQUIRED: current form layouts.
7. General ledger journal export for accounting systems (CSV first, then Xero and QuickBooks connectors).
8. Multi-currency support for tenants paying in more than one currency, with stored exchange rates per pay run.
9. Parallel-run mode: calculate alongside a customer's existing payroll and report differences line by line.

Acceptance criteria: every supplied worked example matches to the cent. Property-based tests show net equals gross minus deductions for all inputs. A completed pay run is immutable. The parallel-run report is produced for a pilot customer before any live run.
```

---

## Phase 5: Performance, talent and engagement

```
Execute Phase 5.

Goal: the BambooHR and HiBob talent suite.

Deliverables:
1. Review cycles: annual, semi-annual, quarterly, probation, 360 and peer feedback, configurable forms, rating scales, anonymity settings, calibration view, signatures.
2. Goals and OKRs with cascading alignment, progress check-ins and weighting.
3. Continuous feedback, recognition, and 1:1 notes with private and shared sections.
4. Competency frameworks and development plans linked to training.
5. Compensation: salary bands, review cycles with budgets, proposals and approvals, history. Salary data restricted by permission.
6. Surveys: pulse and engagement surveys with real anonymity thresholds (no results shown for groups below a minimum size), trend reports and eNPS.
7. Training: courses, assignments, completion tracking, certifications with expiry reminders, real file or SCORM-lite content hosting.
8. People analytics dashboards: performance distribution, attrition risk indicators based on real data, pay equity view.

Acceptance criteria: anonymous survey data cannot be de-anonymised through the UI or API. Compensation endpoints are covered by authorization tests.
```

---

## Phase 6: Recruiting and onboarding

```
Execute Phase 6.

Goal: hire to productive employee without leaving the product.

Deliverables:
1. Requisitions with approval, job postings and a public, SEO-friendly careers page per tenant with real application intake.
2. Applicant pipeline with stages, scorecards, interview scheduling through calendar integration, candidate notes and rejection templates.
3. Resume parsing and storage with consent and retention rules.
4. Offer letters from templates with real e-signature (built in, with signer audit trail and tamper-evident PDF).
5. Onboarding workflows: tasks by role, equipment, document collection, policy acknowledgement, welcome emails, 30/60/90 plans.
6. Convert a hired candidate into an employee record in one step.
7. Offboarding: clearance checklist, asset return, final pay inputs into payroll, access revocation.

HUMAN INPUT REQUIRED: legal review of the e-signature flow and candidate data retention periods.

Acceptance criteria: a candidate applies on the public page, progresses through the pipeline, signs an offer, and appears as an onboarded employee with tasks.
```

---

## Phase 7: FICA/KYC compliance center (your differentiator)

```
Execute Phase 7.

Goal: real compliance screening for financial-sector employers, not a status tracker.

HUMAN INPUT REQUIRED: choice of and credentials for a sanctions and PEP screening data provider, a legal opinion on the screening obligations that apply to your customers, and your retention policy.

Deliverables:
1. Requirement templates per role and risk tier (ID, proof of address with 90-day validity, bank confirmation, tax number, PEP declaration, criminal clearance).
2. Document collection through employee self-service with reviewer verification, expiry tracking and automated reminders.
3. Real sanctions and PEP screening against the provider's API on hire and on a recurring schedule, with match review, false-positive resolution and an audited decision.
4. Risk rating logic that is configurable and explainable, with every score showing its inputs.
5. Compliance dashboard, overdue and expiring items, regulator-ready exportable evidence packs.
6. Segregation of duties: the person who uploads cannot verify.

Acceptance criteria: a test subject on the provider's sandbox watchlist is flagged, reviewed and resolved with a full audit trail. Evidence packs reproduce the audit history exactly.
```

---

## Phase 8: Platform, billing, integrations and AI

```
Execute Phase 8.

Goal: everything needed to sell, scale and extend the product.

Deliverables:
1. Subscription billing through a payment processor: plans (including a free tier), per-employee metering, trials, upgrades and downgrades, invoices, dunning, tax handling and a customer billing portal. HUMAN INPUT REQUIRED: processor choice and credentials, plan names and prices, and tax advice for your jurisdiction.
2. Self-serve tenant onboarding wizard and a super-admin console for support, with impersonation that is audited and visibly flagged to the customer.
3. Public REST API with API keys and scopes, OpenAPI documentation, rate limits and webhooks with signed payloads and retries.
4. SSO: SAML and OIDC per tenant, SCIM user provisioning.
5. Integrations: Slack and Microsoft Teams notifications and approvals, Google and Microsoft calendar sync, accounting exports.
6. HR assistant powered by the Claude API, answering questions using only the tenant's own policies and the asking user's permissions. Employees never see data they could not open in the UI. Log prompts and responses in the audit trail. HUMAN INPUT REQUIRED: Anthropic API key and a data-handling decision on what may be sent.
7. Localisation framework with English first and room for additional languages.
8. Data export of a tenant's complete data and a verified tenant deletion process.

Acceptance criteria: a stranger can sign up, pay, invite staff and use the product with no manual intervention from you. The assistant is tested against permission-bypass attempts.
```

---

## Phase 9: Launch readiness

```
Execute Phase 9.

Goal: be safe to put real customer data in.

Deliverables:
1. Infrastructure as code for staging and production, secrets management, automated backups with point-in-time recovery, and a documented, rehearsed restore.
2. Load test with realistic data volumes (for example 500 tenants and 50,000 employees) and a performance report with fixes applied.
3. Security hardening: dependency scanning, SAST in CI, security headers, CSRF and CORS review, upload abuse tests, secrets scan, and an internal threat model.
4. External penetration test. HUMAN INPUT REQUIRED: engage a third-party tester, and fix all high and critical findings.
5. Disaster recovery and incident response runbooks, on-call rota, status page, uptime monitoring and alerting.
6. Data protection: records of processing, retention schedules, breach notification procedure, subprocessor list. HUMAN INPUT REQUIRED: legal review against Jamaica's Data Protection Act and any other jurisdiction you will serve.
7. Legal documents published in-app: terms, privacy policy, data processing agreement, acceptable use. HUMAN INPUT REQUIRED: drafted by a lawyer.
8. Customer success kit: help centre, onboarding guides, migration guides from BambooHR, Zoho People, HiBob, Employment Hero and OrangeHRM, and a pilot programme with two or three friendly customers before general availability.
9. Final audit of the "nothing simulated" rule: a script and written report listing every external dependency and confirming no mock data path exists in production builds.

Acceptance criteria: restore drill passed, pen-test criticals closed, pilot customers paid payroll successfully in parallel run, legal documents live. Only then open sign-ups.
```

---

## Phase handoff prompt (use at the start of every new session)

```
Read CLAUDE.md and docs/PROGRESS.md. Summarise the current state in ten lines, list any Human Inputs still outstanding, and tell me whether the previous phase meets its acceptance criteria. Do not begin the next phase until I confirm.
```

## Phase review prompt (use before merging each phase)

```
Act as a skeptical reviewer of the phase just completed. Check for: simulated or hardcoded behaviour, missing authorization checks, tenant isolation gaps, unaudited writes, untested edge cases, and anything marked done that was not actually run. Report findings ranked by severity and fix the critical ones.
```
