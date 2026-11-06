-- VerticalHR Phase 3: Time, Attendance, Offline Punch Sync, Geofencing, and Timesheets
-- Enforces offline punch idempotency, payroll locking, and Row-Level Security

-- ============================================================================
-- 1. CONFIGURED WORK SITES (GEOFENCING HUBS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    radius_meters INT NOT NULL DEFAULT 150, -- 150-meter geofence perimeter
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_work_sites_tenant ON work_sites(tenant_id);

-- ============================================================================
-- 2. ATTENDANCE PUNCHES (IMMUTABLE TIME CAPTURE LOG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_punches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    punch_type VARCHAR(30) NOT NULL CHECK (punch_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),
    punch_time TIMESTAMPTZ NOT NULL,
    
    -- Idempotency key guaranteeing offline punches sync once and only once
    idempotency_key VARCHAR(150) NOT NULL,
    
    -- Geofencing GPS Verification
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    work_site_id UUID REFERENCES work_sites(id),
    geofence_status VARCHAR(20) NOT NULL DEFAULT 'inside' CHECK (geofence_status IN ('inside', 'outside', 'bypassed', 'unknown')),
    distance_from_site_meters INT,
    
    -- Photo / Selfie Verification
    selfie_file_id UUID REFERENCES files(id),
    
    -- Sync Metadata
    is_offline_sync BOOLEAN NOT NULL DEFAULT FALSE,
    device_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_punch_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_punches_emp_time ON attendance_punches(employee_id, punch_time);

-- ============================================================================
-- 3. CONFIGURABLE OVERTIME & PAY POLICIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS overtime_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL DEFAULT 'Standard Overtime Policy',
    daily_threshold_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.00,
    weekly_threshold_hours NUMERIC(4, 2) NOT NULL DEFAULT 40.00,
    multiplier_standard NUMERIC(3, 2) NOT NULL DEFAULT 1.50, -- 1.5x regular overtime
    multiplier_sunday_holiday NUMERIC(3, 2) NOT NULL DEFAULT 2.00, -- 2.0x double-time
    auto_break_deduction_minutes INT NOT NULL DEFAULT 30, -- 30 mins auto-deduct after 5 continuous hours
    break_trigger_hours NUMERIC(4, 2) NOT NULL DEFAULT 5.00,
    rounding_interval_minutes INT NOT NULL DEFAULT 15, -- 15-minute rounding
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ============================================================================
-- 4. TIMESHEETS (WEEKLY PERIODS WITH PAYROLL CLOSE LOCK)
-- ============================================================================
CREATE TABLE IF NOT EXISTS timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    regular_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    overtime_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    holiday_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    total_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'supervisor_approved', 'payroll_locked')),
    
    -- Strict Payroll Close Lock (Cannot be edited once payroll runs without audited reopen)
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES users(id),
    reopened_at TIMESTAMPTZ,
    reopened_by UUID REFERENCES users(id),
    reopen_reason TEXT,
    
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_timesheet_period UNIQUE (tenant_id, employee_id, period_start_date)
);

CREATE INDEX IF NOT EXISTS idx_timesheets_emp ON timesheets(employee_id, period_start_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(tenant_id, status);

CREATE TABLE IF NOT EXISTS timesheet_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    project_code VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    task_description TEXT NOT NULL,
    hours NUMERIC(4, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ============================================================================
-- 5. ATTENDANCE EXCEPTIONS QUEUE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    exception_type VARCHAR(40) NOT NULL CHECK (exception_type IN ('late_arrival', 'early_departure', 'missed_clock_out', 'out_of_geofence', 'unauthorized_overtime')),
    punch_id UUID REFERENCES attendance_punches(id),
    work_date DATE NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_exceptions_tenant ON attendance_exceptions(tenant_id, is_resolved);

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) FOR PHASE 3 TABLES
-- ============================================================================
ALTER TABLE work_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sites FORCE ROW LEVEL SECURITY;

ALTER TABLE attendance_punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_punches FORCE ROW LEVEL SECURITY;

ALTER TABLE overtime_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_policies FORCE ROW LEVEL SECURITY;

ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets FORCE ROW LEVEL SECURITY;

ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries FORCE ROW LEVEL SECURITY;

ALTER TABLE attendance_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_exceptions FORCE ROW LEVEL SECURITY;

CREATE POLICY ws_isolation ON work_sites FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY ap_isolation ON attendance_punches FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY op_isolation ON overtime_policies FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY ts_isolation ON timesheets FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY ae_isolation ON attendance_exceptions FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
