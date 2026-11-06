/**
 * VerticalHR Role-Based Access Control (RBAC) System
 * Defines explicit permissions mapped across all 7 standard organizational roles.
 */

export const ROLES = [
  'super_admin',
  'hr_admin',
  'hr_manager',
  'line_manager',
  'supervisor',
  'employee',
  'auditor',
] as const;

export type UserRole = (typeof ROLES)[number];

export const PERMISSIONS = [
  // Tenant Administration
  'tenant:manage',
  'tenant:read',
  'tenant:billing',

  // User & Identity
  'users:read',
  'users:invite',
  'users:manage_roles',
  'users:deactivate',

  // Employee Records
  'employee:read_all',
  'employee:read_self',
  'employee:read_team',
  'employee:create',
  'employee:update',
  'employee:delete',
  'employee:view_sensitive', // Bank details, national tax IDs, salaries
  'employee:edit_sensitive',

  // Leave Management
  'leave:read_all',
  'leave:read_team',
  'leave:read_self',
  'leave:request',
  'leave:approve_supervisor',
  'leave:approve_hr',
  'leave:adjust_balance',
  'leave:manage_types',

  // Time & Attendance
  'time:read_all',
  'time:read_team',
  'time:read_self',
  'time:clock_in_out',
  'time:approve_timesheets',
  'time:manage_schedules',

  // Performance & Talents
  'performance:read_all',
  'performance:read_team',
  'performance:read_self',
  'performance:manage_cycles',
  'performance:submit_assessment',
  'performance:sign_review',

  // Payroll
  'payroll:read',
  'payroll:calculate',
  'payroll:approve',
  'payroll:finalize',
  'payroll:export',

  // Compliance (FICA/KYC)
  'compliance:read',
  'compliance:verify',
  'compliance:audit',

  // Documents & Storage
  'document:read_company',
  'document:read_confidential',
  'document:upload',
  'document:delete',
  'document:sign',

  // Workflows & Approvals
  'workflow:approve',
  'workflow:reassign',
  'workflow:delegate',

  // Audit Logs (Immutable append-only)
  'audit:read',
  'audit:verify_tamper',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  super_admin: PERMISSIONS, // Full platform access

  hr_admin: [
    'tenant:read',
    'users:read',
    'users:invite',
    'users:manage_roles',
    'users:deactivate',
    'employee:read_all',
    'employee:read_self',
    'employee:read_team',
    'employee:create',
    'employee:update',
    'employee:delete',
    'employee:view_sensitive',
    'employee:edit_sensitive',
    'leave:read_all',
    'leave:read_team',
    'leave:read_self',
    'leave:request',
    'leave:approve_supervisor',
    'leave:approve_hr',
    'leave:adjust_balance',
    'leave:manage_types',
    'time:read_all',
    'time:read_team',
    'time:read_self',
    'time:clock_in_out',
    'time:approve_timesheets',
    'time:manage_schedules',
    'performance:read_all',
    'performance:read_team',
    'performance:read_self',
    'performance:manage_cycles',
    'performance:submit_assessment',
    'performance:sign_review',
    'payroll:read',
    'payroll:calculate',
    'payroll:approve',
    'payroll:finalize',
    'payroll:export',
    'compliance:read',
    'compliance:verify',
    'compliance:audit',
    'document:read_company',
    'document:read_confidential',
    'document:upload',
    'document:delete',
    'document:sign',
    'workflow:approve',
    'workflow:reassign',
    'workflow:delegate',
    'audit:read',
    'audit:verify_tamper',
  ],

  hr_manager: [
    'users:read',
    'users:invite',
    'employee:read_all',
    'employee:read_self',
    'employee:read_team',
    'employee:create',
    'employee:update',
    'employee:view_sensitive',
    'leave:read_all',
    'leave:read_team',
    'leave:read_self',
    'leave:request',
    'leave:approve_hr',
    'time:read_all',
    'time:read_team',
    'time:read_self',
    'time:clock_in_out',
    'time:approve_timesheets',
    'performance:read_all',
    'performance:read_team',
    'performance:read_self',
    'performance:submit_assessment',
    'payroll:read',
    'compliance:read',
    'compliance:verify',
    'document:read_company',
    'document:read_confidential',
    'document:upload',
    'document:sign',
    'workflow:approve',
  ],

  line_manager: [
    'employee:read_team',
    'employee:read_self',
    'leave:read_team',
    'leave:read_self',
    'leave:request',
    'leave:approve_supervisor',
    'time:read_team',
    'time:read_self',
    'time:clock_in_out',
    'time:approve_timesheets',
    'performance:read_team',
    'performance:read_self',
    'performance:submit_assessment',
    'performance:sign_review',
    'document:read_company',
    'document:upload',
    'document:sign',
    'workflow:approve',
  ],

  supervisor: [
    'employee:read_team',
    'employee:read_self',
    'leave:read_team',
    'leave:read_self',
    'leave:request',
    'leave:approve_supervisor',
    'time:read_team',
    'time:read_self',
    'time:clock_in_out',
    'time:approve_timesheets',
    'performance:read_team',
    'performance:read_self',
    'performance:submit_assessment',
    'document:read_company',
    'document:sign',
    'workflow:approve',
  ],

  employee: [
    'employee:read_self',
    'leave:read_self',
    'leave:request',
    'time:read_self',
    'time:clock_in_out',
    'performance:read_self',
    'performance:submit_assessment',
    'performance:sign_review',
    'compliance:read',
    'document:read_company',
    'document:upload',
    'document:sign',
  ],

  auditor: [
    'tenant:read',
    'users:read',
    'employee:read_all',
    'leave:read_all',
    'time:read_all',
    'performance:read_all',
    'payroll:read',
    'compliance:read',
    'compliance:audit',
    'document:read_company',
    'audit:read',
    'audit:verify_tamper',
  ],
};

/**
 * Checks if a given role has the required permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const granted = ROLE_PERMISSIONS[role];
  if (!granted) return false;
  return (granted as readonly string[]).includes(permission);
}
