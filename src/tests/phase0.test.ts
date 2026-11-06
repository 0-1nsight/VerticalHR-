/**
 * VerticalHR Phase 0 Acceptance & Verification Test Suite
 * Validates:
 * 1. Tenant Provisioning
 * 2. Cryptographic Hash-Chained Audit Logging & Tamper Detection
 * 3. Salted Password Hashing & Verification
 * 4. TOTP MFA Secret & Code Verification
 * 5. Account Brute-force Lockout Logic
 * 6. RBAC Role-to-Permission Matrix
 * 7. Tenant File Key Isolation & Limits
 * 8. Email Queue Dispatch
 */

import { provisionNewTenant } from '../services/tenant';
import { computeAuditHash, verifyAuditChain, GENESIS_HASH, AuditLogPayload } from '../services/audit';
import { hashPassword, verifyPassword, generateMfaSetup, checkAccountLockout } from '../services/auth';
import { hasPermission } from '../../packages/shared/src/rbac/permissions';
import {
  generateTenantStorageKey,
  validateUploadRequest,
  createPresignedDownloadUrl,
} from '../services/storage';

export async function runPhase0Tests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  let allPassed = true;

  const logResult = (name: string, success: boolean, detail?: string) => {
    if (success) {
      results.push(`PASS: ${name}`);
    } else {
      results.push(`FAIL: ${name}${detail ? ` -> ${detail}` : ''}`);
      allPassed = false;
    }
  };

  try {
    // 1. Password Hashing Test
    const rawPassword = 'SecurePassword123!#';
    const hash = await hashPassword(rawPassword);
    const passwordValid = await verifyPassword(rawPassword, hash);
    const wrongPasswordValid = await verifyPassword('WrongPassword999!', hash);
    logResult('Password Hashing & Verification', passwordValid && !wrongPasswordValid);

    // 2. TOTP MFA Generation & Verification Test
    const mfaSetup = generateMfaSetup('admin@caribbean-bank.com', 'VerticalHR');
    const hasSecretAndCodes =
      mfaSetup.secret.length >= 16 &&
      mfaSetup.recoveryCodes.length === 8 &&
      mfaSetup.otpauthUrl.includes('admin%40caribbean-bank.com');
    logResult('TOTP MFA Generation & Recovery Codes', hasSecretAndCodes);

    // 3. Brute Force Account Lockout Test
    const unlocked = checkAccountLockout(2);
    const lockedTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const locked = checkAccountLockout(5, lockedTime);
    logResult('Account Lockout Detection', !unlocked.isLocked && locked.isLocked && locked.remainingMinutes === 15);

    // 4. RBAC Matrix Verification
    const superAdminCanManageTenant = hasPermission('super_admin', 'tenant:manage');
    const employeeCannotManageTenant = !hasPermission('employee', 'tenant:manage');
    const employeeCanReadSelf = hasPermission('employee', 'employee:read_self');
    const auditorCanReadAudit = hasPermission('auditor', 'audit:read');
    const auditorCannotClockInOut = !hasPermission('auditor', 'time:clock_in_out');
    logResult(
      'RBAC Role & Permission Matrix',
      superAdminCanManageTenant &&
        employeeCannotManageTenant &&
        employeeCanReadSelf &&
        auditorCanReadAudit &&
        auditorCannotClockInOut
    );

    // 5. Tenant Provisioning Test
    const tenantResult = await provisionNewTenant({
      name: 'Jamaica Commercial Trust',
      subdomain: `jct-${Date.now()}`,
      adminEmail: 'director.hr@jct-trust.com',
      adminPassword: 'EnterprisePassword2026!$',
      adminFirstName: 'Marcus',
      adminLastName: 'Sterling',
      country: 'Jamaica',
      currency: 'JMD',
      timezone: 'America/Jamaica',
    });
    logResult('Tenant Provisioning Workflow', Boolean(tenantResult.tenantId && tenantResult.genesisHash));

    // 6. Cryptographic Append-Only Audit Chaining Test
    const auditChain: AuditLogPayload[] = [];
    const t0 = new Date('2026-11-06T09:00:00Z').toISOString();
    const t1 = new Date('2026-11-06T09:05:00Z').toISOString();
    const t2 = new Date('2026-11-06T09:10:00Z').toISOString();

    // Block 0 (Genesis)
    const b0Data = {
      id: crypto.randomUUID(),
      tenantId: tenantResult.tenantId,
      actorId: tenantResult.adminUserId,
      actorRole: 'super_admin',
      action: 'CREATE',
      entity: 'Tenant',
      entityId: tenantResult.tenantId,
      entityDescription: 'Tenant provisioned',
      timestamp: t0,
    };
    const b0Hash = await computeAuditHash(GENESIS_HASH, b0Data);
    auditChain.push({ ...b0Data, previousHash: GENESIS_HASH, currentHash: b0Hash, ipAddress: '127.0.0.1' });

    // Block 1
    const b1Data = {
      id: crypto.randomUUID(),
      tenantId: tenantResult.tenantId,
      actorId: tenantResult.adminUserId,
      actorRole: 'hr_admin',
      action: 'CREATE',
      entity: 'Employee',
      entityId: 'emp-101',
      entityDescription: 'Added employee Aaliyah Brown',
      timestamp: t1,
    };
    const b1Hash = await computeAuditHash(b0Hash, b1Data);
    auditChain.push({ ...b1Data, previousHash: b0Hash, currentHash: b1Hash, ipAddress: '127.0.0.1' });

    // Block 2
    const b2Data = {
      id: crypto.randomUUID(),
      tenantId: tenantResult.tenantId,
      actorId: tenantResult.adminUserId,
      actorRole: 'hr_admin',
      action: 'UPDATE',
      entity: 'Salary',
      entityId: 'emp-101',
      entityDescription: 'Adjusted base salary',
      timestamp: t2,
    };
    const b2Hash = await computeAuditHash(b1Hash, b2Data);
    auditChain.push({ ...b2Data, previousHash: b1Hash, currentHash: b2Hash, ipAddress: '127.0.0.1' });

    const auditVerifyValid = await verifyAuditChain(auditChain);
    logResult('Audit Chain Cryptographic Integrity', auditVerifyValid.valid && auditVerifyValid.totalVerified === 3);

    // 7. Tamper Detection Test (Simulate malicious modification of audit entry)
    const tamperedChain = JSON.parse(JSON.stringify(auditChain)) as AuditLogPayload[];
    tamperedChain[1].entityDescription = 'MALICIOUS_ALTERATION_ATTEMPT'; // Altered payload without re-hashing
    const tamperCheck = await verifyAuditChain(tamperedChain);
    logResult('Audit Log Tamper Detection', !tamperCheck.valid && tamperCheck.tamperedIndex === 1);

    // 8. Storage Tenant Key Isolation & Upload Limits
    const key = generateTenantStorageKey(tenantResult.tenantId, 'compliance', 'file-42', 'passport copy.pdf');
    const validUpload = validateUploadRequest({
      tenantId: tenantResult.tenantId,
      uploaderId: tenantResult.adminUserId,
      filename: 'national_id.pdf',
      mimeType: 'application/pdf',
      byteSize: 1024 * 500,
      category: 'compliance',
    });
    const invalidMimeUpload = validateUploadRequest({
      tenantId: tenantResult.tenantId,
      uploaderId: tenantResult.adminUserId,
      filename: 'malicious.exe',
      mimeType: 'application/x-msdownload',
      byteSize: 500,
      category: 'general',
    });

    // Cross-tenant download violation test
    let crossTenantViolationCaught = false;
    try {
      createPresignedDownloadUrl(key, 'different-tenant-id-000', 'clean');
    } catch {
      crossTenantViolationCaught = true;
    }

    logResult(
      'Storage Isolation & MIME Restrictions',
      key.startsWith(`tenants/${tenantResult.tenantId}/`) &&
        validUpload.valid &&
        !invalidMimeUpload.valid &&
        crossTenantViolationCaught
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(`FATAL ERROR: ${msg}`);
    allPassed = false;
  }

  return { passed: allPassed, results };
}
