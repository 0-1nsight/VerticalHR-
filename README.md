# VerticalHR

Production-grade, multi-tenant Human Resource Management & Payroll platform engineered for enterprise compliance, featuring Caribbean statutory payroll and FICA/KYC compliance for regulated employers.

---

## Benchmarks & Core Architecture

VerticalHR is designed around the key architectural capabilities of top global HR suites:
- **Zoho People**: Broad operational modules, rich leave accruals, and attendance tracking.
- **BambooHR**: Simple UX, streamlined onboarding, employee lifecycle, and performance reviews.
- **HiBob**: Dynamic employee experience, continuous feedback, and people analytics.
- **Employment Hero**: Integrated statutory payroll and automated compliance reporting.
- **OrangeHRM**: Extensible and open data architecture.
- **VerticalHR Differentiators**: Jamaican/Caribbean statutory deduction engine (PAYE, NIS, NHT, Education Tax, HEART/NTA) and FICA/KYC compliance verification center.

---

## Architectural Principles

1. **Zero Simulation**: All persistent operations interact with real PostgreSQL databases, real session management, and real storage providers. No `localStorage` data stores.
2. **Strict Multi-Tenancy**: Every tenant-owned database record has `tenant_id` protected by PostgreSQL Row-Level Security (RLS) enforced at the engine level.
3. **Cryptographic Append-Only Audit Logging**: All mutations are recorded in a SHA-256 hash-chained ledger (`audit_log`) where previous hashes are cryptographically chained to prevent and detect any tampering.
4. **Defense-in-Depth Authentication**: Argon2id/salted password hashing, RFC 6238 TOTP Multi-Factor Authentication (MFA) with single-use recovery codes, and brute-force lockout.
5. **Granular RBAC**: 7 standard roles (`super_admin`, `hr_admin`, `hr_manager`, `line_manager`, `supervisor`, `employee`, `auditor`) mapped to an explicit permission matrix enforced on every endpoint.

---

## Project Structure

```
.
├── apps/
│   └── web/                   # React 18, Vite, Tailwind CSS, Lucide icons
├── packages/
│   ├── shared/                # Zod schemas, RBAC permission matrix, common types
│   └── db/                    # PostgreSQL DDL, migrations, RLS policies
├── src/
│   ├── components/            # UI modules (Employees, Leave, Time, Performance, FICA, etc.)
│   ├── contexts/              # Authentication and Application contexts
│   ├── services/              # Audit, Auth, Storage, Email, Tenant services
│   ├── tests/                 # Phase acceptance test suites and test runner
│   └── types/                 # Domain types and interfaces
├── docker-compose.yml         # Local development PostgreSQL 16, MinIO, and Mailpit
├── .env.example               # Environment variable specification
└── Prompt.md                  # Master build instructions & phase milestones
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 22+
- Docker and Docker Compose (for local PostgreSQL, MinIO, and Mailpit)

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Local Infrastructure
```bash
docker compose up -d
```
This provisions:
- **PostgreSQL 16** on `localhost:5432` with initial schema & RLS policies
- **MinIO S3** on `localhost:9000` (Console on `localhost:9001`)
- **Mailpit** SMTP on `localhost:1025` (Web UI on `localhost:8025`)

### 4. Run the Dev Server
```bash
npm run dev
```
Open `http://localhost:3000` to access the application.

---

## Running Verification & Tests

To execute the Phase 0 acceptance test suite verifying password hashing, TOTP MFA, account lockout, RBAC permissions, tenant creation, cryptographic audit hash-chaining, tamper detection, and storage isolation:

```bash
npx tsx src/tests/run.ts
```

To run strict TypeScript compilation checks:
```bash
npx tsc -b
```

To run linter:
```bash
npm run lint
```

---

## Security & Audit Immutability

The `audit_log` table enforces append-only semantics:
- Database triggers reject `UPDATE` and `DELETE` queries.
- Each entry calculates `current_hash = SHA256(prev_hash || tenant_id || actor_id || action || entity || entity_id || entity_description || timestamp || changes)`.
- Verification routines walk the chronological chain from the genesis block (`0000...0000`) and detect unauthorized alterations at the row level.
