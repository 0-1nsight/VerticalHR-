/**
 * PostgreSQL Schema Definitions for VerticalHR Foundation
 */

export interface DbTenant {
  id: string;
  slug: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  fiscalYearStartMonth: number;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpiresAt?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpiresAt?: string | null;
  mfaEnabled: boolean;
  mfaSecret?: string | null;
  mfaRecoveryCodes: string[];
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbMembership {
  id: string;
  tenantId: string;
  userId: string;
  roleId: string;
  status: 'active' | 'invited' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface DbSession {
  id: string;
  userId: string;
  tenantId: string;
  tokenHash: string;
  ipAddress: string;
  userAgent?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface DbAuditLog {
  id: string;
  tenantId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  entityDescription: string;
  changes?: Record<string, unknown> | null;
  previousHash: string;
  currentHash: string;
  ipAddress: string;
  userAgent?: string | null;
  createdAt: string;
}

export interface DbFile {
  id: string;
  tenantId: string;
  uploaderId?: string | null;
  storageKey: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  scanStatus: 'pending' | 'clean' | 'flagged' | 'quarantined';
  metadata: Record<string, unknown>;
  createdAt: string;
}
