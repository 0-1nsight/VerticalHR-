-- VerticalHR Phase 2: Production-Grade Leave Management & Accrual Ledger
-- Implements immutable ledger-based balances, Jamaican statutory holidays, and RLS

-- ============================================================================
-- 1. LEAVE TYPES & ACCRUAL POLICIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL, -- 'VACATION', 'SICK', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID'
    description TEXT,
    
    -- Accrual Rules
    accrual_method VARCHAR(30) NOT NULL DEFAULT 'monthly' CHECK (accrual_method IN ('monthly', 'anniversary', 'upfront', 'none')),
    accrual_rate_per_period NUMERIC(6, 3) NOT NULL DEFAULT 1.167, -- e.g. 1.167 days/month = 14 days/year
    annual_quota NUMERIC(6, 2) NOT NULL DEFAULT 14.00,
    
    -- Carry-Over Rules
    carry_over_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    carry_over_cap NUMERIC(6, 2) NOT NULL DEFAULT 5.00,
    carry_over_expiry_months INT NOT NULL DEFAULT 6, -- Unused carried leave expires after 6 months
    
    -- Balance Constraints
    allow_negative_balance BOOLEAN NOT NULL DEFAULT FALSE,
    negative_limit NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    
    -- Units & Eligibility
    unit VARCHAR(20) NOT NULL DEFAULT 'days' CHECK (unit IN ('days', 'half_days', 'hours')),
    requires_documentation BOOLEAN NOT NULL DEFAULT FALSE,
    documentation_threshold_days INT NOT NULL DEFAULT 2, -- e.g. Doctor's note for > 2 days sick leave
    min_tenure_months_required INT NOT NULL DEFAULT 0,
    gender_eligibility VARCHAR(20) DEFAULT 'all' CHECK (gender_eligibility IN ('all', 'female', 'male')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_tenant_leave_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_leave_types_tenant ON leave_types(tenant_id);

-- ============================================================================
-- 2. STATUTORY PUBLIC HOLIDAYS & COMPANY CALENDARS
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL DEFAULT 'Standard Jamaica Corporate Calendar',
    work_days JSONB NOT NULL DEFAULT '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]'::jsonb,
    standard_hours_per_day NUMERIC(4, 2) NOT NULL DEFAULT 8.00,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS public_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    calendar_id UUID REFERENCES company_calendars(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    holiday_date DATE NOT NULL,
    observed_date DATE NOT NULL,
    is_statutory BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_tenant_holiday UNIQUE (tenant_id, holiday_date, name)
);

CREATE INDEX IF NOT EXISTS idx_holidays_tenant_date ON public_holidays(tenant_id, observed_date);

-- ============================================================================
-- 3. BLACKOUT PERIODS
-- ============================================================================
CREATE TABLE IF NOT EXISTS blackout_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    applies_to_department_id UUID REFERENCES departments(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_blackout_tenant ON blackout_periods(tenant_id, start_date, end_date);

-- ============================================================================
-- 4. LEAVE REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    workflow_id UUID REFERENCES workflows(id),
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(5, 2) NOT NULL,
    is_half_day BOOLEAN NOT NULL DEFAULT FALSE,
    half_day_session VARCHAR(20) CHECK (half_day_session IN ('morning', 'afternoon')),
    
    reason TEXT NOT NULL,
    supporting_document_id UUID REFERENCES documents(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'supervisor_approved', 'hr_approved', 'rejected', 'cancelled')),
    
    supervisor_approver_id UUID REFERENCES users(id),
    supervisor_decision_at TIMESTAMPTZ,
    supervisor_comments TEXT,
    
    hr_approver_id UUID REFERENCES users(id),
    hr_decision_at TIMESTAMPTZ,
    hr_comments TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_emp ON leave_requests(employee_id, start_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(tenant_id, status);

-- ============================================================================
-- 5. IMMUTABLE LEAVE ACCRUAL & USAGE LEDGER (SOURCE OF TRUTH)
-- ============================================================================
-- Balances are ALWAYS derived by summing ledger transactions.
CREATE TABLE IF NOT EXISTS leave_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    
    entry_type VARCHAR(40) NOT NULL CHECK (entry_type IN ('accrual', 'usage', 'carry_over', 'adjustment', 'expiry', 'cancellation_credit')),
    units NUMERIC(6, 3) NOT NULL, -- Positive for credits, negative for debits
    effective_date DATE NOT NULL,
    
    -- Idempotency key for scheduled accrual jobs (e.g. "accrual:2026-03:emp_uuid:leave_uuid")
    idempotency_key VARCHAR(150),
    
    reference_id UUID, -- References leave_requests(id) for 'usage', or admin user id for 'adjustment'
    reason TEXT NOT NULL,
    
    actor_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_ledger_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_leave_ledger_emp ON leave_ledger(employee_id, leave_type_id, effective_date);

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) FOR PHASE 2 TABLES
-- ============================================================================
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types FORCE ROW LEVEL SECURITY;

ALTER TABLE company_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_calendars FORCE ROW LEVEL SECURITY;

ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_holidays FORCE ROW LEVEL SECURITY;

ALTER TABLE blackout_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_periods FORCE ROW LEVEL SECURITY;

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE leave_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_ledger FORCE ROW LEVEL SECURITY;

CREATE POLICY lt_isolation ON leave_types FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY cc_isolation ON company_calendars FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY ph_isolation ON public_holidays FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY bp_isolation ON blackout_periods FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY lr_isolation ON leave_requests FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY ll_isolation ON leave_ledger FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Ledger immutability: forbid UPDATE or DELETE on ledger transactions
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Leave ledger records are append-only and immutable. Reverse or adjust with an adjustment entry instead.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_leave_ledger_mod ON leave_ledger;
CREATE TRIGGER trg_prevent_leave_ledger_mod
    BEFORE UPDATE OR DELETE ON leave_ledger
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_modification();
