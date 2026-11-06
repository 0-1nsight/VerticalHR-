-- ============================================================================
-- VerticalHR Phase 6: Recruitment & Onboarding Schema
-- ============================================================================

-- Job Requisitions Table
CREATE TABLE IF NOT EXISTS job_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  hiring_manager_id UUID REFERENCES employees(id),
  headcount INTEGER NOT NULL DEFAULT 1 CHECK (headcount > 0),
  employment_type VARCHAR(50) NOT NULL DEFAULT 'full_time',
  salary_budget_min INTEGER NOT NULL,
  salary_budget_max INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
  urgency VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'pending_approval', 'open', 'filled', 'cancelled')),
  target_start_date DATE NOT NULL,
  job_description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Candidates & Applicant Tracking Table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requisition_id UUID REFERENCES job_requisitions(id) ON DELETE SET NULL,
  job_title VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  stage VARCHAR(30) NOT NULL DEFAULT 'applied' CHECK (stage IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  score NUMERIC(3, 1) DEFAULT 3.0,
  source VARCHAR(50) NOT NULL DEFAULT 'Direct',
  resume_storage_key VARCHAR(500),
  consent_to_store_data BOOLEAN NOT NULL DEFAULT true,
  retention_expiry_date DATE NOT NULL,
  notes TEXT,
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interview Scorecards Table
CREATE TABLE IF NOT EXISTS interview_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES users(id),
  stage VARCHAR(50) NOT NULL,
  technical_competency INTEGER NOT NULL CHECK (technical_competency BETWEEN 1 AND 5),
  cultural_alignment INTEGER NOT NULL CHECK (cultural_alignment BETWEEN 1 AND 5),
  problem_solving INTEGER NOT NULL CHECK (problem_solving BETWEEN 1 AND 5),
  communication_skills INTEGER NOT NULL CHECK (communication_skills BETWEEN 1 AND 5),
  overall_score NUMERIC(3, 2) NOT NULL,
  recommendation VARCHAR(30) NOT NULL CHECK (recommendation IN ('strong_hire', 'hire', 'lean_hire', 'no_hire')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offer Letters with Tamper-Evident Signatures Table
CREATE TABLE IF NOT EXISTS offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  base_salary INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'declined', 'expired')),
  signer_name VARCHAR(255),
  signer_email VARCHAR(255),
  signer_ip VARCHAR(45),
  signed_at TIMESTAMPTZ,
  tamper_evident_hash VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Onboarding Task Workflows Table (30/60/90 Day Readiness)
CREATE TABLE IF NOT EXISTS onboarding_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('it_equipment', 'paperwork', 'compliance', 'training', 'team_welcome', 'manager_checkin')),
  phase VARCHAR(20) NOT NULL CHECK (phase IN ('pre_boarding', 'day_one', 'first_week', '30_days', '60_days', '90_days')),
  assigned_to VARCHAR(100) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offboarding & Exit Clearance Table
CREATE TABLE IF NOT EXISTS offboarding_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  resignation_or_exit_date DATE NOT NULL,
  reason VARCHAR(100) NOT NULL,
  it_laptop_collected BOOLEAN NOT NULL DEFAULT false,
  security_access_revoked BOOLEAN NOT NULL DEFAULT false,
  hr_exit_interview_done BOOLEAN NOT NULL DEFAULT false,
  finance_deductions_cleared BOOLEAN NOT NULL DEFAULT false,
  accrued_leave_encashment_days NUMERIC(4, 1) NOT NULL DEFAULT 0,
  payroll_final_settlement_processed BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'cleared', 'escalated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE job_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_clearances ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_job_requisitions ON job_requisitions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_candidates ON candidates
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_interview_scorecards ON interview_scorecards
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_offer_letters ON offer_letters
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_onboarding_workflows ON onboarding_workflows
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_offboarding_clearances ON offboarding_clearances
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
