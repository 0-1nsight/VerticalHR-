import { z } from 'zod';

export const AuditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'EXPORT',
  'LOGIN',
  'LOGOUT',
  'MFA_ENABLE',
  'MFA_DISABLE',
  'DELEGATE',
  'SIGN',
  'PASSWORD_RESET',
]);

export const AuditEntrySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  actorId: z.string().uuid().or(z.string().min(1)),
  actorEmail: z.string().email().optional(),
  actorRole: z.string().min(1),
  action: AuditActionSchema,
  entity: z.string().min(1),
  entityId: z.string().min(1),
  entityDescription: z.string(),
  changes: z.record(z.unknown()).nullable().optional(),
  previousHash: z.string().length(64, 'SHA-256 hash required'),
  currentHash: z.string().length(64, 'SHA-256 hash required'),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type AuditAction = z.infer<typeof AuditActionSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
