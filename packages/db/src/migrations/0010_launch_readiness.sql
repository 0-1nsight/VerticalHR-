-- ============================================================================
-- VerticalHR Phase 9: Launch Readiness, Disaster Recovery & Legal Schema
-- ============================================================================

-- In-App Statutory Legal Consents (Jamaica Data Protection Act 2020 Compliance)
CREATE TABLE IF NOT EXISTS tenant_legal_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('terms_of_service', 'privacy_policy', 'data_processing_agreement', 'acceptable_use_policy')),
  document_version VARCHAR(20) NOT NULL DEFAULT '2026.1',
  user_ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  audit_hash VARCHAR(64) NOT NULL,
  CONSTRAINT uq_tenant_user_doc_version UNIQUE (tenant_id, user_id, document_type, document_version)
);

-- Customer Universal Data Migration Batches & Audit Logs
CREATE TABLE IF NOT EXISTS data_migration_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
  source_system VARCHAR(50) NOT NULL CHECK (source_system IN ('universal_csv', 'universal_excel', 'bamboohr', 'hibob', 'zoho_people', 'orange_hrm')),
  file_name VARCHAR(255) NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  total_records INTEGER NOT NULL,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  diagnostics JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'validating' CHECK (status IN ('validating', 'dry_run_passed', 'dry_run_failed', 'imported', 'rolled_back')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Disaster Recovery (DR) Rehearsed Restore Drills & Verification Logs
CREATE TABLE IF NOT EXISTS disaster_recovery_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_type VARCHAR(50) NOT NULL CHECK (drill_type IN ('point_in_time_recovery', 'cross_region_failover', 'snapshot_integrity')),
  simulated_tenants_count INTEGER NOT NULL DEFAULT 500,
  simulated_records_count INTEGER NOT NULL DEFAULT 50000,
  backup_snapshot_timestamp TIMESTAMPTZ NOT NULL,
  restore_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restore_completed_at TIMESTAMPTZ NOT NULL,
  recovery_point_objective_seconds INTEGER NOT NULL, -- RPO
  recovery_time_objective_seconds INTEGER NOT NULL,  -- RTO
  data_integrity_verified BOOLEAN NOT NULL DEFAULT true,
  conducted_by_user_id UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  drill_certificate_hash VARCHAR(64) NOT NULL
);

-- "Nothing Simulated" Production Readiness Certifications
CREATE TABLE IF NOT EXISTS production_readiness_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_version VARCHAR(20) NOT NULL,
  scanner_tool VARCHAR(50) NOT NULL DEFAULT 'VerticalHR Production Audit Scanner v1.0',
  modules_inspected JSONB NOT NULL,
  mock_fallbacks_detected INTEGER NOT NULL DEFAULT 0,
  unverified_calculations_detected INTEGER NOT NULL DEFAULT 0,
  is_certified_production_ready BOOLEAN NOT NULL DEFAULT true,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  audited_by_user_id UUID NOT NULL REFERENCES users(id),
  certificate_sha256 VARCHAR(64) NOT NULL
);

-- Row-Level Security (RLS)
ALTER TABLE tenant_legal_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_migration_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_legal_consents_isolation ON tenant_legal_consents
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY data_migration_batches_isolation ON data_migration_batches
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
