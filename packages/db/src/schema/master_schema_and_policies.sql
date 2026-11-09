-- ============================================================================
-- VerticalHRM Master PostgreSQL Schema & Row-Level Security (RLS) Policies
-- Enterprise Multi-Tenant Architecture with Strict Employee Privacy Enforcement
-- Compliant with Jamaica Data Protection Act (JDPA 2020) & TAJ Statutory Rules
-- ============================================================================

-- 0. Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Multi-Tenancy & User Identities
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdomain VARCHAR(63) NOT NULL UNIQUE,
    legal_business_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'JM',
    default_currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Jamaica',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    totp_secret_encrypted VARCHAR(255),
    totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL CHECK (role IN (
        'super_admin', 'hr_admin', 'admin', 'hr_manager', 'line_manager', 'supervisor', 'employee', 'auditor'
    )),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 2. Core HR, Positions & Employee Roster (with Field-Level Encryption)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_employee_id UUID,
    max_leave_per_day INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    job_level VARCHAR(20) NOT NULL DEFAULT 'L3',
    min_salary_cents BIGINT,
    max_salary_cents BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employee_code VARCHAR(30) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    corporate_email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    department_id UUID NOT NULL REFERENCES departments(id),
    position_id UUID NOT NULL REFERENCES positions(id),
    reports_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    supervisor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    employment_type VARCHAR(30) NOT NULL DEFAULT 'full_time',
    employment_status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'probation', 'active', 'terminated'
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    work_location VARCHAR(100) NOT NULL DEFAULT 'Kingston Corporate Hub',
    
    -- Sensitive & Confidential Fields (AES-256-GCM Encrypted at rest)
    salary_minor_units BIGINT NOT NULL, -- Stored in integer cents
    salary_currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
    bank_account_encrypted TEXT,
    bank_branch_code VARCHAR(20),
    trn_encrypted TEXT,                -- Jamaica Taxpayer Registration Number (Encrypted)
    nis_encrypted TEXT,                -- Jamaica National Insurance Scheme Number (Encrypted)
    fica_risk_tier VARCHAR(20) NOT NULL DEFAULT 'tier_2_standard',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, employee_code)
);

-- ----------------------------------------------------------------------------
-- 3. Cryptographic Append-Only Audit Trail
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL, -- SHA-256 Chained Hash
    current_hash VARCHAR(64) NOT NULL,  -- SHA-256 Chained Hash
    ip_address INET,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. Leave Management & Immutable Accrual Ledger
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    accrual_rate_per_month NUMERIC(4, 2) NOT NULL DEFAULT 1.25,
    max_carry_over_days NUMERIC(4, 2) NOT NULL DEFAULT 5.0,
    requires_medical_proof BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    entry_type VARCHAR(30) NOT NULL, -- 'monthly_accrual', 'usage_deduction', 'manual_adjustment', 'carryover_expiry'
    days_delta NUMERIC(5, 2) NOT NULL, -- Positive for accrual, negative for deductions
    effective_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    working_days_requested NUMERIC(4, 2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    approver_employee_id UUID REFERENCES employees(id),
    decision_notes TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. Time & Attendance (GPS Geofencing & Timesheets)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS attendance_punches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    punch_type VARCHAR(20) NOT NULL, -- 'clock_in', 'clock_out'
    punched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geofence_verified BOOLEAN NOT NULL DEFAULT FALSE,
    offline_idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    regular_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    daily_overtime_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    holiday_double_time_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'submitted', 'approved', 'payroll_locked'
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. Jamaican Statutory Payroll Engine
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    run_reference VARCHAR(50) NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'calculated', 'approved', 'finalized', 'immutable_locked'
    total_gross_cents BIGINT NOT NULL DEFAULT 0,
    total_net_cents BIGINT NOT NULL DEFAULT 0,
    total_paye_cents BIGINT NOT NULL DEFAULT 0,
    total_nis_cents BIGINT NOT NULL DEFAULT 0,
    total_nht_cents BIGINT NOT NULL DEFAULT 0,
    total_ed_tax_cents BIGINT NOT NULL DEFAULT 0,
    total_heart_cents BIGINT NOT NULL DEFAULT 0,
    approved_by_first UUID REFERENCES users(id),
    approved_by_second UUID REFERENCES users(id),
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    gross_pay_cents BIGINT NOT NULL,
    net_pay_cents BIGINT NOT NULL,
    paye_tax_cents BIGINT NOT NULL,
    nis_employee_cents BIGINT NOT NULL,
    nis_employer_cents BIGINT NOT NULL,
    nht_employee_cents BIGINT NOT NULL,
    nht_employer_cents BIGINT NOT NULL,
    ed_tax_employee_cents BIGINT NOT NULL,
    ed_tax_employer_cents BIGINT NOT NULL,
    heart_employer_cents BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. Performance Reviews, 360 Feedback & OKRs
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS performance_review_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    cycle_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES performance_review_cycles(id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES employees(id),
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    self_evaluation TEXT,
    manager_evaluation TEXT,
    final_score NUMERIC(3, 2),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_360_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES performance_review_cycles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES employees(id),
    evaluator_id UUID REFERENCES employees(id),
    evaluator_relationship VARCHAR(30) NOT NULL, -- 'self', 'manager', 'peer', 'direct_report'
    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    overall_rating NUMERIC(3, 2),
    strengths TEXT,
    growth_areas TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals_okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_goal_id UUID REFERENCES goals_okrs(id) ON DELETE SET NULL,
    level VARCHAR(20) NOT NULL, -- 'company', 'department', 'individual'
    department VARCHAR(100),
    owner_id UUID REFERENCES employees(id),
    title VARCHAR(200) NOT NULL,
    metric_target NUMERIC(10, 2) NOT NULL DEFAULT 100.0,
    metric_current NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    weight_percentage NUMERIC(5, 2) NOT NULL DEFAULT 25.0,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. Confidential 9-Box Talent Assessments & Compensation Bands
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS talent_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    performance_score INTEGER NOT NULL CHECK (performance_score BETWEEN 1 AND 3),
    potential_score INTEGER NOT NULL CHECK (potential_score BETWEEN 1 AND 3),
    box_category VARCHAR(50) NOT NULL, -- 'star', 'high_performer', 'core_player', 'dilemma', etc.
    attrition_risk VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    attrition_drivers JSONB NOT NULL DEFAULT '[]',
    succession_readiness VARCHAR(30) NOT NULL DEFAULT 'not_ready',
    assessed_by UUID REFERENCES users(id),
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, employee_id)
);

CREATE TABLE IF NOT EXISTS compensation_salary_bands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_family VARCHAR(100) NOT NULL,
    level_code VARCHAR(20) NOT NULL,
    title VARCHAR(150) NOT NULL,
    min_salary NUMERIC(12, 2) NOT NULL,
    mid_salary NUMERIC(12, 2) NOT NULL,
    max_salary NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pulse_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    min_anonymity_threshold INTEGER NOT NULL DEFAULT 5, -- k-anonymity guarantee
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pulse_survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES pulse_surveys(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
    anonymous_feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. FICA & KYC Compliance Center
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS compliance_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'government_id', 'proof_of_address', 'police_record', 'bank_letter'
    file_storage_key VARCHAR(255) NOT NULL,
    document_expiry_date DATE,
    uploader_user_id UUID NOT NULL REFERENCES users(id),
    verifier_user_id UUID REFERENCES users(id),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verified_at TIMESTAMPTZ,
    -- Strict Segregation of Duties: Uploader CANNOT approve own KYC document
    CONSTRAINT chk_four_eyes_segregation CHECK (uploader_user_id <> verifier_user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_review_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_360_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals_okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_salary_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_verifications ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Base Multi-Tenant Isolation Policies (Zero Cross-Tenant Leakage)
-- ----------------------------------------------------------------------------
CREATE POLICY tenant_isolation_departments ON departments FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_positions ON positions FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_leave_types ON leave_types FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_leave_ledger ON leave_ledger_entries FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_punches ON attendance_punches FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_timesheets ON timesheets FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_perf_cycles ON performance_review_cycles FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_okrs ON goals_okrs FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_pulse_surveys ON pulse_surveys FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_pulse_responses ON pulse_survey_responses FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_compliance ON compliance_verifications FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ----------------------------------------------------------------------------
-- CRITICAL POLICY: 9-Box Talent Matrix Privacy & Confidentiality Guard
-- Non-management employees CANNOT see other employees' talent/attrition scores!
-- Line managers see ONLY their direct subordinates.
-- ----------------------------------------------------------------------------
CREATE POLICY rbac_talent_assessments_privacy ON talent_assessments
FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
        -- HR Admins, Super Admins, and HR Managers see all within tenant
        current_setting('app.current_user_role', true) IN ('super_admin', 'hr_admin', 'admin', 'hr_manager', 'finance_director')
        OR (
            -- Line Managers and Supervisors see ONLY their direct reports
            current_setting('app.current_user_role', true) IN ('line_manager', 'supervisor')
            AND employee_id IN (
                SELECT id FROM employees 
                WHERE (supervisor_id = current_setting('app.current_employee_id', true)::uuid 
                   OR reports_to = current_setting('app.current_employee_id', true)::uuid)
            )
        )
        -- Note: Regular 'employee' and 'contractor' are EXCLUDED from SELECT on talent_assessments of others
    )
);

-- Management Write Access on Talent Assessments
CREATE POLICY rbac_talent_assessments_modify ON talent_assessments
FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND current_setting('app.current_user_role', true) IN ('super_admin', 'hr_admin', 'admin', 'hr_manager')
);

-- ----------------------------------------------------------------------------
-- Compensation Salary Bands Privacy Policy
-- Strictly restricted to HR Admins, Super Admins, and Finance Directors
-- ----------------------------------------------------------------------------
CREATE POLICY rbac_compensation_bands ON compensation_salary_bands
FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND current_setting('app.current_user_role', true) IN ('super_admin', 'hr_admin', 'admin', 'finance_director')
);

-- ----------------------------------------------------------------------------
-- Payroll Runs & Line Items Protection
-- Restricted to Payroll Officers, HR Admins, and Compliance Auditors
-- ----------------------------------------------------------------------------
CREATE POLICY rbac_payroll_runs ON payroll_runs
FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
        current_setting('app.current_user_role', true) IN ('super_admin', 'hr_admin', 'admin', 'finance_director', 'auditor')
    )
);

CREATE POLICY rbac_payroll_items ON payroll_line_items
FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
        current_setting('app.current_user_role', true) IN ('super_admin', 'hr_admin', 'admin', 'finance_director', 'auditor')
        OR employee_id = current_setting('app.current_employee_id', true)::uuid -- Employee only views own payslip
    )
);

-- ----------------------------------------------------------------------------
-- Leave Requests Privacy Policy
-- Employees see only their own; Line managers see their subordinates; HR sees all
-- ----------------------------------------------------------------------------
CREATE POLICY rbac_leave_requests ON leave_requests
FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
        current_setting('app.current_user_role', true) IN ('super_admin', 'hr_admin', 'admin', 'hr_manager')
        OR employee_id = current_setting('app.current_employee_id', true)::uuid
        OR approver_employee_id = current_setting('app.current_employee_id', true)::uuid
        OR (
            current_setting('app.current_user_role', true) IN ('line_manager', 'supervisor')
            AND employee_id IN (
                SELECT id FROM employees 
                WHERE (supervisor_id = current_setting('app.current_employee_id', true)::uuid 
                   OR reports_to = current_setting('app.current_employee_id', true)::uuid)
            )
        )
    )
);

-- ----------------------------------------------------------------------------
-- Immutable Cryptographic Audit Log RLS Policies
-- Append-Only: INSERT allowed for all tenant actions; SELECT restricted to Admins & Auditors
-- UPDATE and DELETE are PERMANENTLY REVOKED
-- ----------------------------------------------------------------------------
CREATE POLICY audit_logs_insert ON audit_logs
FOR INSERT WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY audit_logs_select ON audit_logs
FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND current_setting('app.current_user_role', true) IN ('super_admin', 'hr_admin', 'admin', 'auditor')
);

-- Explicitly revoke destructive privileges on audit table
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- Performance Reviews & 360 Evaluations Privacy
-- Employees see only reviews where they are the reviewee or nominated rater
-- ----------------------------------------------------------------------------
CREATE POLICY rbac_performance_reviews ON performance_reviews
FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
        current_setting('app.current_user_role', true) IN ('super_admin', 'hr_admin', 'admin', 'hr_manager')
        OR employee_id = current_setting('app.current_employee_id', true)::uuid
        OR reviewer_id = current_setting('app.current_employee_id', true)::uuid
    )
);

CREATE POLICY rbac_360_evaluations ON performance_360_evaluations
FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
        current_setting('app.current_user_role', true) IN ('super_admin', 'hr_admin', 'admin', 'hr_manager')
        OR reviewee_id = current_setting('app.current_employee_id', true)::uuid
        OR evaluator_id = current_setting('app.current_employee_id', true)::uuid
    )
);
