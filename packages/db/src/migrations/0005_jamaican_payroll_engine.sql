-- ============================================================================
-- Migration 0005: Jamaican Statutory Payroll Engine, Pay Runs & Accounting GL
-- Multi-Tenant RLS, Effective-Dated Tax Tables, S01 Returns & ACH Bank Exports
-- ============================================================================

-- 1. Effective-Dated Statutory Rules Table
CREATE TABLE IF NOT EXISTS statutory_tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    country_code VARCHAR(3) NOT NULL DEFAULT 'JAM',
    effective_from DATE NOT NULL,
    effective_to DATE,
    nis_employee_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.0300,
    nis_employer_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.0300,
    nis_annual_wage_ceiling NUMERIC(12, 2) NOT NULL DEFAULT 5000000.00,
    nht_employee_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.0200,
    nht_employer_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.0300,
    ed_tax_employee_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.0225,
    ed_tax_employer_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.0350,
    heart_employer_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.0300,
    paye_annual_threshold NUMERIC(12, 2) NOT NULL DEFAULT 1700088.00,
    paye_standard_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.2500,
    paye_higher_bracket_threshold NUMERIC(12, 2) NOT NULL DEFAULT 6000000.00,
    paye_higher_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.3000,
    max_pension_deductible_percent NUMERIC(6, 4) NOT NULL DEFAULT 0.2000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Pay Elements Catalog (Earnings, Allowances, Voluntary Deductions)
CREATE TABLE IF NOT EXISTS pay_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    classification VARCHAR(30) NOT NULL, -- 'salary', 'hourly', 'allowance', 'bonus', 'commission', 'benefit_in_kind', 'deduction', 'pension', 'garnishment'
    is_taxable_paye BOOLEAN NOT NULL DEFAULT TRUE,
    is_subject_to_nis BOOLEAN NOT NULL DEFAULT TRUE,
    is_subject_to_nht BOOLEAN NOT NULL DEFAULT TRUE,
    is_subject_to_ed_tax BOOLEAN NOT NULL DEFAULT TRUE,
    is_employer_contribution BOOLEAN NOT NULL DEFAULT FALSE,
    gl_debit_account_code VARCHAR(50),
    gl_credit_account_code VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Pay Runs (Batch Processing Lifecycle with Two-Person Approval)
CREATE TABLE IF NOT EXISTS pay_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    run_number VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    pay_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'bi_weekly', 'weekly'
    currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
    exchange_rate_to_base NUMERIC(10, 4) NOT NULL DEFAULT 1.0000,
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'calculated', 'reviewed', 'approved', 'finalized', 'reversed'
    total_gross_pay NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_employee_statutory_deductions NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_voluntary_deductions NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_net_pay NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_employer_statutory_contributions NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    calculated_by UUID REFERENCES users(id),
    calculated_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES users(id),
    finalized_at TIMESTAMPTZ,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Pay Run Items (Per Employee Line Items)
CREATE TABLE IF NOT EXISTS pay_run_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    hourly_rate NUMERIC(10, 2),
    regular_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    overtime_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    overtime_pay NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    taxable_allowances NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    non_taxable_allowances NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    bonuses NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gross_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    -- Statutory Deductions
    employee_nis NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    employer_nis NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    employee_nht NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    employer_nht NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    employee_ed_tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    employer_ed_tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    employer_heart NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    employee_pension NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    taxable_gross_paye NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    employee_paye NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    other_deductions NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_employee_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_employer_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'direct_deposit', -- 'direct_deposit', 'cheque', 'cash'
    bank_account_number_encrypted TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Payslips
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pay_run_item_id UUID NOT NULL REFERENCES pay_run_items(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    period_title VARCHAR(100) NOT NULL,
    pay_date DATE NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    sent_by_email BOOLEAN NOT NULL DEFAULT FALSE,
    viewed_by_employee_at TIMESTAMPTZ,
    document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. General Ledger (GL) Journal Entries
CREATE TABLE IF NOT EXISTS gl_payroll_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
    journal_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    debit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    credit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Bank Payment Batches (ACH / Direct Deposit Exports)
CREATE TABLE IF NOT EXISTS bank_payment_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
    batch_reference VARCHAR(50) NOT NULL,
    bank_format VARCHAR(30) NOT NULL, -- 'NCB_ACH', 'BNS_SCOTIA', 'JN_BANK', 'STANDARD_NACHA'
    total_records INTEGER NOT NULL,
    total_batch_amount NUMERIC(14, 2) NOT NULL,
    file_content TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Parallel Run Comparison Logs
CREATE TABLE IF NOT EXISTS parallel_run_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    legacy_gross NUMERIC(12, 2) NOT NULL,
    system_gross NUMERIC(12, 2) NOT NULL,
    legacy_net NUMERIC(12, 2) NOT NULL,
    system_net NUMERIC(12, 2) NOT NULL,
    legacy_tax NUMERIC(12, 2) NOT NULL,
    system_tax NUMERIC(12, 2) NOT NULL,
    variance_net NUMERIC(10, 2) NOT NULL,
    is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-Level Security Policies
ALTER TABLE statutory_tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_run_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_payroll_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_payment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE parallel_run_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_tax_rules ON statutory_tax_rules FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_pay_elements ON pay_elements FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_pay_runs ON pay_runs FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_pay_run_items ON pay_run_items FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_payslips ON payslips FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_gl_journals ON gl_payroll_journals FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_bank_batches ON bank_payment_batches FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_parallel_runs ON parallel_run_comparisons FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
