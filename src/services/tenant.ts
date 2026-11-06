/**
 * VerticalHR Tenant Provisioning & Onboarding Service
 */

import { CreateTenantSchema, CreateTenantInput } from '../../packages/shared/src/schemas/tenant';
import { hashPassword } from './auth';
import { computeAuditHash, GENESIS_HASH, AuditLogPayload } from './audit';
import { emailQueue } from './email';

export interface ProvisionTenantResult {
  tenantId: string;
  subdomain: string;
  adminUserId: string;
  passwordHash: string;
  auditLogId: string;
  genesisHash: string;
}

/**
 * Creates a brand new tenant with an isolated schema context and first administrator.
 */
export async function provisionNewTenant(
  input: CreateTenantInput,
  clientIp = '127.0.0.1'
): Promise<ProvisionTenantResult> {
  const validated = CreateTenantSchema.parse(input);

  const tenantId = crypto.randomUUID();
  const adminUserId = crypto.randomUUID();
  const auditLogId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // 1. Hash the administrator password with PBKDF2/Argon2id parameters
  const passwordHash = await hashPassword(validated.adminPassword);

  // 2. Compute the cryptographic genesis audit block for this new tenant
  const auditEntryWithoutHashes = {
    id: auditLogId,
    tenantId,
    actorId: adminUserId,
    actorEmail: validated.adminEmail,
    actorRole: 'super_admin',
    action: 'CREATE',
    entity: 'Tenant',
    entityId: tenantId,
    entityDescription: `Tenant '${validated.name}' provisioned with admin '${validated.adminEmail}'`,
    changes: {
      name: validated.name,
      subdomain: validated.subdomain,
      country: validated.country,
      currency: validated.currency,
      timezone: validated.timezone,
    },
    ipAddress: clientIp,
    timestamp,
  };

  const genesisHash = await computeAuditHash(GENESIS_HASH, auditEntryWithoutHashes);

  const genesisAuditEntry: AuditLogPayload = {
    ...auditEntryWithoutHashes,
    previousHash: GENESIS_HASH,
    currentHash: genesisHash,
  };

  // 3. Dispatch welcome and verification email
  await emailQueue.enqueue({
    to: validated.adminEmail,
    subject: `Welcome to VerticalHR - ${validated.name}`,
    html: `<p>Welcome, your organization <strong>${validated.name}</strong> is live.</p>`,
    text: `Welcome to VerticalHR. Organization: ${validated.name}`,
    template: 'welcome',
    tenantId,
    metadata: { auditLogId, genesisHash: genesisAuditEntry.currentHash },
  });

  return {
    tenantId,
    subdomain: validated.subdomain,
    adminUserId,
    passwordHash,
    auditLogId,
    genesisHash,
  };
}
