-- VerticalHR Phase 1: Core HR, Documents, Lifecycle, and Generic Workflow Engine
-- Includes field-level encrypted columns, effective-dated career movements, and RLS

-- ============================================================================
-- 1. DEPARTMENTS & POSITIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    manager_id UUID,
    parent_department_id UUID REFERENCES departments(id),
    max_leave_per_day INT DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_tenant_dept_name UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    level SMALLINT NOT NULL DEFAULT 1,
    description TEXT,
    salary_band_min_cents BIGINT NOT NULL DEFAULT 0,
    salary_band_max_cents BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_positions_dept ON positions(department_id);

-- ============================================================================
-- 2. EMPLOYEES (CORE PERSONNEL MASTER RECORD)
-- ============================================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employee_number VARCHAR(50) NOT NULL,
    
    -- Personal details
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    address JSONB DEFAULT '{}'::jsonb,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    
    -- Employment & Org
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    reporting_manager_id UUID REFERENCES employees(id),
    work_location VARCHAR(150) DEFAULT 'Headquarters',
    employment_type VARCHAR(30) NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
    status VARCHAR(30) NOT NULL DEFAULT 'probation' CHECK (status IN ('active', 'probation', 'notice_period', 'suspended', 'terminated', 'resigned')),
    
    -- Dates & Lifecycle
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    termination_date DATE,
    termination_reason TEXT,
    
    -- Remuneration (Integer minor units / cents)
    salary_minor_units BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'JMD',
    
    -- Encrypted Sensitive Identifiers (AES-256-GCM ciphertext)
    encrypted_trn TEXT,           -- Tax Registration Number (Jamaica) or National Tax ID
    encrypted_bank_account TEXT,  -- Account number
    encrypted_bank_routing TEXT,  -- Routing / Branch code
    bank_name VARCHAR(100),
    bank_account_type VARCHAR(20) DEFAULT 'checking',
    is_bank_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Custom fields per tenant
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_tenant_emp_number UNIQUE (tenant_id, employee_number),
    CONSTRAINT uq_tenant_emp_email UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(reporting_manager_id);

-- ============================================================================
-- 3. EFFECTIVE-DATED CAREER MOVEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS career_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    movement_type VARCHAR(40) NOT NULL CHECK (movement_type IN ('hire', 'probation_confirmation', 'promotion', 'transfer', 'demotion', 'lateral_move', 'termination')),
    effective_date DATE NOT NULL,
    from_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    to_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    salary_change JSONB,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_career_movements_emp ON career_movements(employee_id, effective_date DESC);

-- ============================================================================
-- 4. EXIT CLEARANCE CHECKLISTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS exit_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    resignation_date DATE NOT NULL,
    final_working_day DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'cleared', 'settled', 'cancelled')),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_exit_checklists_emp ON exit_checklists(employee_id);

-- ============================================================================
-- 5. DOCUMENT VAULT & POLICY ACKNOWLEDGMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    access_level VARCHAR(30) NOT NULL DEFAULT 'employee_and_hr' CHECK (access_level IN ('public', 'hr_only', 'supervisor_and_hr', 'employee_and_hr')),
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_date DATE,
    requires_signature BOOLEAN NOT NULL DEFAULT FALSE,
    is_signed BOOLEAN NOT NULL DEFAULT FALSE,
    signed_by_name VARCHAR(150),
    signed_at TIMESTAMPTZ,
    verification_status VARCHAR(20) DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_cat ON documents(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(employee_id);

CREATE TABLE IF NOT EXISTS policy_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    ip_address INET NOT NULL,
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_policy_emp UNIQUE (document_id, employee_id)
);

-- ============================================================================
-- 6. GENERIC MULTI-STEP WORKFLOW ENGINE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_type VARCHAR(50) NOT NULL, -- 'profile_change', 'leave', 'promotion', 'document', 'letter'
    entity_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    requester_id UUID NOT NULL REFERENCES employees(id),
    current_step INT NOT NULL DEFAULT 1,
    total_steps INT NOT NULL DEFAULT 2,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'delegated', 'cancelled')),
    urgency VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
    current_approver_role VARCHAR(50) NOT NULL,
    current_approver_id UUID REFERENCES users(id),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_workflows_tenant_status ON workflows(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflows_approver ON workflows(current_approver_role, current_approver_id);

-- ============================================================================
-- 7. HR LETTER TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_letter_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_tenant_letter_type UNIQUE (tenant_id, template_type)
);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) FOR PHASE 1 TABLES
-- ============================================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments FORCE ROW LEVEL SECURITY;

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions FORCE ROW LEVEL SECURITY;

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;

ALTER TABLE career_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_movements FORCE ROW LEVEL SECURITY;

ALTER TABLE exit_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_checklists FORCE ROW LEVEL SECURITY;

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

ALTER TABLE policy_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgments FORCE ROW LEVEL SECURITY;

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_letter_templates FORCE ROW LEVEL SECURITY;

-- Apply standard isolation policy across all Phase 1 tables
CREATE POLICY depts_isolation ON departments FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY pos_isolation ON positions FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY emp_isolation ON employees FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY cm_isolation ON career_movements FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY exit_isolation ON exit_checklists FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY docs_isolation ON documents FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY policy_isolation ON policy_acknowledgments FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY wf_isolation ON workflows FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY letter_isolation ON hr_letter_templates FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
