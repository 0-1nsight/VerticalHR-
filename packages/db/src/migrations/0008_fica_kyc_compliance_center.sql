-- ============================================================================
-- VerticalHR Phase 7: FICA & KYC Compliance Center Schema
-- ============================================================================

-- Role & Risk Tier Requirement Templates
CREATE TABLE IF NOT EXISTS compliance_requirement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  risk_tier VARCHAR(20) NOT NULL CHECK (risk_tier IN ('low', 'medium', 'high', 'critical')),
  role_category VARCHAR(100) NOT NULL,
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  re_screening_interval_days INTEGER NOT NULL DEFAULT 365,
  proof_of_address_validity_days INTEGER NOT NULL DEFAULT 90,
  requires_pep_declaration BOOLEAN NOT NULL DEFAULT true,
  requires_criminal_clearance BOOLEAN NOT NULL DEFAULT false,
  requires_adverse_media_screening BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee Compliance Profiles & Risk Ratings
CREATE TABLE IF NOT EXISTS employee_compliance_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  risk_tier VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (risk_tier IN ('low', 'medium', 'high', 'critical')),
  risk_score NUMERIC(5, 2) NOT NULL DEFAULT 25.0,
  risk_score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(25) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('compliant', 'pending_review', 'action_required', 'non_compliant', 'flagged')),
  is_pep BOOLEAN NOT NULL DEFAULT false,
  pep_details JSONB,
  sanctions_screening_passed BOOLEAN NOT NULL DEFAULT false,
  last_screened_at TIMESTAMPTZ,
  next_scheduled_screening TIMESTAMPTZ,
  last_audited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance Documents & Verifications (with Segregation of Duties)
CREATE TABLE IF NOT EXISTS compliance_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN (
    'id_document', 'proof_of_address', 'bank_confirmation', 'tax_number', 
    'pep_declaration', 'criminal_clearance', 'source_of_funds', 'adverse_media'
  )),
  document_id UUID REFERENCES files(id),
  document_hash VARCHAR(64) NOT NULL,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  verified_by_user_id UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  expiry_date DATE,
  rejection_reason TEXT,
  verification_notes TEXT,
  -- Strict Segregation of Duties database constraint: uploader cannot verify!
  CONSTRAINT chk_segregation_of_duties CHECK (uploaded_by_user_id <> verified_by_user_id)
);

-- Sanctions & PEP Screening Watchlist Hits & Adjudications
CREATE TABLE IF NOT EXISTS sanctions_screening_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  provider_name VARCHAR(100) NOT NULL DEFAULT 'OpenSanctions-FID-Sandbox',
  screening_type VARCHAR(30) NOT NULL CHECK (screening_type IN ('onboarding', 'scheduled_recurring', 'ad_hoc_refresh')),
  match_detected BOOLEAN NOT NULL DEFAULT false,
  match_score NUMERIC(5, 2) DEFAULT 0.0,
  watchlist_source VARCHAR(100),
  matched_name VARCHAR(255),
  match_details JSONB DEFAULT '{}'::jsonb,
  adjudication_status VARCHAR(30) NOT NULL DEFAULT 'cleared' CHECK (adjudication_status IN ('cleared', 'potential_match', 'confirmed_match', 'false_positive')),
  adjudicated_by UUID REFERENCES users(id),
  adjudicated_at TIMESTAMPTZ,
  adjudication_rationale TEXT,
  adjudication_evidence_hash VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Regulator-Ready Evidence Packs & Audit Export Certifications
CREATE TABLE IF NOT EXISTS compliance_evidence_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pack_reference_number VARCHAR(100) NOT NULL UNIQUE,
  regulator_target VARCHAR(100) NOT NULL DEFAULT 'BOJ / FID Compliance Inspection',
  compliance_officer_id UUID NOT NULL REFERENCES users(id),
  evidence_manifest JSONB NOT NULL,
  evidence_pack_sha256 VARCHAR(64) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE compliance_requirement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_compliance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_screening_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_comp_templates ON compliance_requirement_templates
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_comp_profiles ON employee_compliance_profiles
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_comp_verifications ON compliance_verifications
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_screening_events ON sanctions_screening_events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_evidence_packs ON compliance_evidence_packs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
