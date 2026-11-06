-- ============================================================================
-- VerticalHR Phase 8: Platform, Billing, Integrations & AI Schema
-- ============================================================================

-- Tenant Subscriptions & Metering
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_tier VARCHAR(30) NOT NULL CHECK (plan_tier IN ('free', 'standard', 'enterprise')),
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status VARCHAR(20) NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
  base_fee_cents INTEGER NOT NULL DEFAULT 0,
  per_seat_fee_cents INTEGER NOT NULL DEFAULT 600, -- e.g. $4 USD / 600 JMD per seat
  current_active_seats INTEGER NOT NULL DEFAULT 1,
  included_free_seats INTEGER NOT NULL DEFAULT 5, -- Free tier threshold
  currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
  tax_rate_percent NUMERIC(4, 2) NOT NULL DEFAULT 15.00, -- Jamaica GCT standard
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  payment_customer_id VARCHAR(100),
  payment_method_last4 VARCHAR(4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_subscription UNIQUE (tenant_id)
);

-- Subscription Invoices & Billing History
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES tenant_subscriptions(id),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metered_seat_count INTEGER NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  tax_amount_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'JMD',
  status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'open', 'past_due', 'void', 'refunded')),
  dunning_attempt_count INTEGER NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Super-Admin Impersonation Sessions (Audited Support Access)
CREATE TABLE IF NOT EXISTS super_admin_impersonations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_user_id UUID NOT NULL REFERENCES users(id),
  target_tenant_id UUID NOT NULL REFERENCES tenants(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  session_token_hash VARCHAR(64) NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '60 minutes', -- 1-hour strict max
  revoked_at TIMESTAMPTZ,
  actions_recorded_count INTEGER NOT NULL DEFAULT 0,
  audit_fingerprint VARCHAR(64) NOT NULL
);

-- Public REST API Keys & Scopes
CREATE TABLE IF NOT EXISTS tenant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL, -- e.g. "vhr_live_abc12"
  key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of secret
  scopes JSONB NOT NULL DEFAULT '["read:employees"]'::jsonb,
  rate_limit_rpm INTEGER NOT NULL DEFAULT 120, -- requests per minute
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhook Endpoints & Deliveries with Exponential Backoff Retries
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_url TEXT NOT NULL,
  secret_hash VARCHAR(64) NOT NULL,
  subscribed_events JSONB NOT NULL DEFAULT '["*"]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  webhook_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  signature_header VARCHAR(256) NOT NULL, -- "t=...,v1=..." HMAC signature
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  response_code INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant SSO Configuration (SAML 2.0 / OIDC & SCIM 2.0)
CREATE TABLE IF NOT EXISTS tenant_sso_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sso_protocol VARCHAR(10) NOT NULL CHECK (sso_protocol IN ('saml', 'oidc')),
  idp_entity_id VARCHAR(255) NOT NULL,
  idp_sso_url TEXT NOT NULL,
  idp_certificate TEXT,
  oidc_client_id VARCHAR(255),
  oidc_client_secret_encrypted TEXT,
  scim_enabled BOOLEAN NOT NULL DEFAULT false,
  scim_token_hash VARCHAR(64),
  enforce_sso_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_sso UNIQUE (tenant_id)
);

-- AI HR Policy Assistant Query Log (with Tamper Audit & RBAC Block Flags)
CREATE TABLE IF NOT EXISTS ai_policy_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  user_role VARCHAR(50) NOT NULL,
  prompt TEXT NOT NULL,
  policy_citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  response_content TEXT NOT NULL,
  rbac_violation_blocked BOOLEAN NOT NULL DEFAULT false,
  violation_reason TEXT,
  audit_fingerprint VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_sso_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_policy_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_subscriptions_isolation ON tenant_subscriptions
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY subscription_invoices_isolation ON subscription_invoices
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_api_keys_isolation ON tenant_api_keys
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY webhook_endpoints_isolation ON webhook_endpoints
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY webhook_deliveries_isolation ON webhook_deliveries
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_sso_configs_isolation ON tenant_sso_configs
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY ai_policy_interactions_isolation ON ai_policy_interactions
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
