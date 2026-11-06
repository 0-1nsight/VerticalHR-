# Phase 9: Launch Readiness Implementation Plan

A comprehensive production readiness, compliance, and migration suite designed to transition VerticalHR from internal verification to general availability (GA) for Jamaican and regional Caribbean employers.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions were confirmed during the planning clarification interview:
> - **Deliverable Scope**: Full Launch Suite spanning In-App Legal & JDPA Compliance, Customer Success & Universal Migrations, Disaster Recovery & Status Page, 50,000-Employee Load Testing, and the "Nothing Simulated" Production Dependency Audit.
> - **Legal & Regulatory Anchor**: Jamaica Data Protection Act (JDPA 2020) and statutory labor legislation (*The Holidays with Pay Act*, *The Employment (Termination and Redundancy Payments) Act*).
> - **Migration Hub Focus**: Universal CSV and Excel data migration schema with real-time field-level column mapping, dry-run validation diagnostics, and one-click import from BambooHR, HiBob, Zoho People, and OrangeHRM exports.

---

### 1. Overview & Core Concept

- **What It Does**: Phase 9 provides the complete operational and legal infrastructure required to safely launch VerticalHR to real paying customers. It delivers in-app published legal agreements (Terms, Privacy, DPA, Acceptable Use), a universal data migration center with interactive validation, an automated disaster recovery and health status monitor, a benchmark load-testing runner capable of simulating 500 tenants and 50,000 employees, and an automated audit script proving zero mock paths exist in production builds.
- **Target Audience / Persona**: Company executives, legal counsel, HR directors migrating from legacy systems or spreadsheets, and technical administrators operating the platform.
- **Key Value**: Guarantees legal compliance under Jamaican data privacy laws, eliminates onboarding friction with flexible universal data imports, and validates high-volume database performance prior to production rollout.

---

### 2. User Experience & Visual Design

- **Navigation & Access**:
  - A new **Launch & Operations Hub** section in the main navigation, accessible to administrators, legal officers, and technical personnel.
  - Dedicated sub-views:
    1. **Legal & Compliance Center**: Clean, tabbed view of the 4 statutory documents (Terms of Service, JDPA Privacy Policy, Data Processing Agreement, Acceptable Use Policy) with download buttons, effective dates, and employee acceptance tracking.
    2. **Customer Success & Migration Studio**: Interactive 3-step file importer (Upload CSV/Excel $\rightarrow$ Map Columns with Auto-Detect $\rightarrow$ Dry-Run Diagnostics & Import Execution) with downloadable schema templates.
    3. **System Health & Disaster Recovery**: Real-time service status (Database, Auth, Payroll Engine, Compliance Screening), rehearsed point-in-time recovery (PITR) drill logs, and incident response runbooks.
    4. **Performance & Load Benchmark**: Interactive benchmark runner testing 500 tenants and 50,000 employee queries, displaying query latency distributions ($p_{50}, p_{95}, p_{99}$) and memory footprints.
    5. **"Nothing Simulated" Audit Inspector**: Automated scanner checking every service module against the production dependency checklist to verify deterministic calculations and zero simulated fallbacks.
- **Visual Theme & Typography**:
  - Display and interface typography: `Plus Jakarta Sans` for clean, professional headers and `DM Sans` for readable body prose.
  - Telemetry and data tables: `JetBrains Mono` with `font-mono tabular-nums` for precise vertical decimal alignment.
  - Cohesive 60-30-10 palette: Clean slate background (`bg-slate-50`), structured white cards with 1px hairline borders (`border-slate-200`), and deep emerald/indigo accents (`text-emerald-700`, `bg-indigo-600`).
- **Interactive States & Motion**:
  - Live dry-run import preview with green/amber row validation badges.
  - Progress indicators during the 50,000-employee load test runner.
  - Instant PDF/text copy actions for legal agreements and audit reports.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Universal CSV/Excel Schema Importer vs Vendor-Specific Hardcoded Adapters**:
  - *Chosen Approach*: Implement a flexible universal mapper with smart auto-detection of column headers (e.g. mapping "Tax ID", "TRN", or "Social Security" to the standard field) paired with downloadable pre-configured templates for BambooHR, HiBob, and Zoho People.
  - *Why*: Enables employers using custom spreadsheets or any legacy software to migrate without custom coding, while preserving data validation rules.
- **Decision 2: In-App Statutory Legal Center with Versioned Acceptance Ledger**:
  - *Chosen Approach*: Store legal policies as markdown/HTML with statutory effective dates, and record user consent in an immutable audit ledger.
  - *Why*: Satisfies Section 22 of the Jamaica Data Protection Act (JDPA 2020) requiring documented records of consent for personal data processing.
- **Decision 3: In-Memory / Worker Load Test Engine**:
  - *Chosen Approach*: Build a dedicated benchmark runner in `src/services/launchReadinessEngine.ts` that synthetically measures memory consumption, batch payroll calculation speed, and query lookups for 50,000 employee records without database pollution.
  - *Why*: Provides verifiable performance metrics and throughput guarantees in CI and test environments without bloating storage.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       VerticalHR Launch Readiness Hub                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│ Statutory Legal  │         │ Universal Data   │         │ System Health &  │
│ Center (JDPA)    │         │ Migration Studio │         │ Disaster Recovery│
│ • Terms & DPA    │         │ • CSV/XLSX Parse │         │ • Service Prober │
│ • Privacy Policy │         │ • Auto-Map Cols  │         │ • PITR Restore   │
│ • Audit Consent  │         │ • Dry-Run Check  │         │ • Incident Rota  │
└────────┬─────────┘         └────────┬─────────┘         └────────┬─────────┘
         │                            │                            │
         └─────────────────────────────┼────────────────────────────┘
                                       ▼
         ┌─────────────────────────────────────────────────────────┐
         │             launchReadinessEngine.ts                    │
         │  • 50,000-Employee Load Benchmark & Latency Analysis   │
         │  • "Nothing Simulated" Production Dependency Verifier   │
         │  • JDPA Records of Processing Activities (ROPA) Export  │
         │  • Universal Column Normalization & Validation Engine   │
         └─────────────────────────────┬───────────────────────────┘
                                       ▼
         ┌─────────────────────────────────────────────────────────┐
         │              Acceptance & Verification Suite             │
         │  • src/tests/phase9.test.ts (Automated CI acceptance)   │
         │  • src/tests/run.ts (Phases 0 - 9 Cumulative 60+ Tests) │
         └─────────────────────────────────────────────────────────┘
```

#### Proposed Database Schema (`0010_launch_readiness.sql`)
1. `tenant_legal_consents`: `id`, `tenant_id`, `user_id`, `document_type` (`terms`, `privacy`, `dpa`, `acceptable_use`), `document_version`, `accepted_at`, `ip_address`, `audit_hash`.
2. `data_migration_batches`: `id`, `tenant_id`, `uploaded_by`, `source_format`, `total_rows`, `valid_rows`, `error_rows`, `status`, `diagnostics_summary`, `created_at`.
3. `disaster_recovery_logs`: `id`, `drill_type`, `simulated_data_size_mb`, `recovery_point_objective_sec`, `recovery_time_objective_sec`, `status`, `rehearsed_at`, `verified_by`.
4. `system_audit_certifications`: `id`, `audit_type`, `dependency_checklist`, `mock_code_detected`, `is_certified_production_ready`, `certified_at`.

#### Implementation Plan Tasks
1. **Database Migration**: Create `packages/db/src/migrations/0010_launch_readiness.sql`.
2. **Engine Services (`src/services/launchReadinessEngine.ts`)**:
   - Universal data import mapper and validator with dry-run diagnostic report.
   - 50,000-employee load test runner with benchmark statistics ($p_{50}, p_{95}, p_{99}$, ops/sec).
   - "Nothing simulated" code and dependency scanner verifying zero test stubs in production calculations.
   - Disaster recovery restore simulation and JDPA Record of Processing Activities (ROPA) generator.
3. **Interactive UI Component (`src/components/Launch/LaunchReadinessHub.tsx`)**:
   - Tabbed workspace for Legal Center, Migration Studio, Disaster Recovery & Uptime, Benchmark Suite, and Production Audit.
4. **App Integration**:
   - Connect to `src/components/Layout/Sidebar.tsx` and `src/App.tsx`.
5. **Acceptance Testing & Verification**:
   - Create `src/tests/phase9.test.ts` testing universal mapping, load simulation, JDPA ROPA export, and dependency audit.
   - Integrate into `src/tests/run.ts` to ensure 100% green pass.
   - Co-execute `compile_applet` and `lint_applet`.
   - Update `docs/PROGRESS.md`.
