-- ============================================================================
-- Migration 0006: Performance, Talent, OKRs, Compensation Bands & Pulse Surveys
-- Multi-Tenant RLS, 360 Feedback, Cascading OKRs, k-Anonymity Survey Engine
-- ============================================================================

-- 1. Performance Review Cycles
CREATE TABLE IF NOT EXISTS performance_review_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    cycle_type VARCHAR(30) NOT NULL, -- 'annual', 'semi_annual', 'quarterly', 'probation', '360_feedback'
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'self_assessment', 'manager_review', 'calibration', 'completed'
    rating_scale_max INTEGER NOT NULL DEFAULT 5,
    allow_peer_nominations BOOLEAN NOT NULL DEFAULT TRUE,
    is_calibration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 360-Degree Feedback & Peer Evaluations
CREATE TABLE IF NOT EXISTS performance_360_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES performance_review_cycles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES employees(id),
    evaluator_id UUID REFERENCES employees(id), -- NULL if external or decoupled
    evaluator_relationship VARCHAR(30) NOT NULL, -- 'self', 'manager', 'peer', 'direct_report'
    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    core_competency_scores JSONB NOT NULL DEFAULT '{}',
    strengths TEXT,
    growth_areas TEXT,
    overall_rating NUMERIC(3, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'submitted'
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Cascading Goals & OKRs
CREATE TABLE IF NOT EXISTS goals_okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_goal_id UUID REFERENCES goals_okrs(id) ON DELETE SET NULL,
    level VARCHAR(20) NOT NULL, -- 'company', 'department', 'individual'
    department VARCHAR(100),
    owner_id UUID REFERENCES employees(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    metric_target NUMERIC(10, 2) NOT NULL DEFAULT 100.0,
    metric_current NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    weight_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.0,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- 'not_started', 'in_progress', 'at_risk', 'completed'
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Continuous Feedback & 1-on-1 Notes
CREATE TABLE IF NOT EXISTS continuous_1on1_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES employees(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    meeting_date DATE NOT NULL,
    shared_agenda_notes TEXT,
    action_items JSONB NOT NULL DEFAULT '[]',
    private_manager_notes TEXT, -- Restricted to manager only
    recognition_badge VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Compensation Bands (Restricted Access)
CREATE TABLE IF NOT EXISTS compensation_salary_bands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_family VARCHAR(100) NOT NULL,
    level_code VARCHAR(20) NOT NULL, -- 'L1', 'L2', 'L3', 'L4', 'L5'
    title VARCHAR(150) NOT NULL,
    min_salary NUMERIC(12, 2) NOT NULL,
    mid_salary NUMERIC(12, 2) NOT NULL,
    max_salary NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Compensation Review Cycles & Merit Budgets
CREATE TABLE IF NOT EXISTS compensation_review_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cycle_title VARCHAR(150) NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id),
    current_salary NUMERIC(12, 2) NOT NULL,
    proposed_salary NUMERIC(12, 2) NOT NULL,
    merit_increase_percent NUMERIC(5, 2) NOT NULL,
    proposed_bonus NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    justification TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Pulse Surveys with k-Anonymity
CREATE TABLE IF NOT EXISTS pulse_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    question TEXT NOT NULL,
    min_anonymity_threshold INTEGER NOT NULL DEFAULT 5, -- k-anonymity guarantee
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Pulse Survey Responses (Anonymized: No user_id stored)
CREATE TABLE IF NOT EXISTS pulse_survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES pulse_surveys(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    sentiment VARCHAR(20) NOT NULL, -- 'promoter', 'passive', 'detractor'
    anonymous_feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Talent 9-Box Matrix & Attrition Risk
CREATE TABLE IF NOT EXISTS talent_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    performance_score INTEGER NOT NULL CHECK (performance_score BETWEEN 1 AND 3), -- 1=Low, 2=Medium, 3=High
    potential_score INTEGER NOT NULL CHECK (potential_score BETWEEN 1 AND 3),     -- 1=Low, 2=Medium, 3=High
    box_category VARCHAR(50) NOT NULL, -- 'star', 'high_performer', 'solid_performer', etc.
    attrition_risk VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    attrition_drivers JSONB NOT NULL DEFAULT '[]',
    succession_readiness VARCHAR(30) NOT NULL DEFAULT 'not_ready', -- 'ready_now', '1_year', '2_years', 'not_ready'
    assessed_by UUID REFERENCES users(id),
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE performance_review_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_360_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals_okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuous_1on1_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_salary_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_review_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_perf_cycles ON performance_review_cycles FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_360 ON performance_360_evaluations FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_okrs ON goals_okrs FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_1on1 ON continuous_1on1_notes FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_comp_bands ON compensation_salary_bands FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_comp_proposals ON compensation_review_proposals FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_surveys ON pulse_surveys FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_responses ON pulse_survey_responses FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_isolation_talent ON talent_assessments FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
