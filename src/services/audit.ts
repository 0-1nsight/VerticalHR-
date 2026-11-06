/**
 * VerticalHR Cryptographic Append-Only Audit Service
 * Enforces SHA-256 hash chaining on all audit log rows for tamper detection.
 */

export interface AuditLogPayload {
  id: string;
  tenantId: string;
  actorId: string;
  actorEmail?: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  entityDescription: string;
  changes?: Record<string, unknown> | null;
  previousHash: string;
  currentHash: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
}

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes a deterministic SHA-256 hash for an audit entry chained to the previous hash.
 */
export async function computeAuditHash(
  prevHash: string,
  entry: Omit<AuditLogPayload, 'currentHash' | 'previousHash'>
): Promise<string> {
  const content = [
    prevHash,
    entry.tenantId,
    entry.actorId,
    entry.action,
    entry.entity,
    entry.entityId,
    entry.entityDescription,
    entry.timestamp,
    JSON.stringify(entry.changes ?? {}),
  ].join('::');

  // Use Web Crypto API available natively in Node.js 18+ and modern browsers
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies the integrity of a chronological chain of audit log entries.
 * Returns valid=true only if every link in the cryptographic chain is intact.
 */
export async function verifyAuditChain(
  entries: AuditLogPayload[]
): Promise<{
  valid: boolean;
  totalVerified: number;
  tamperedIndex?: number;
  reason?: string;
}> {
  if (entries.length === 0) {
    return { valid: true, totalVerified: 0 };
  }

  // Sort ascending by timestamp to verify chronology
  const chain = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i];

    // 1. Verify that previousHash correctly references the previous block
    if (entry.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        totalVerified: i,
        tamperedIndex: i,
        reason: `Broken chain link at index ${i}: expected prevHash ${expectedPrevHash.slice(0, 16)}..., got ${entry.previousHash.slice(0, 16)}...`,
      };
    }

    // 2. Recompute the entry hash and verify against the recorded currentHash
    const recomputedHash = await computeAuditHash(expectedPrevHash, entry);
    if (recomputedHash !== entry.currentHash) {
      return {
        valid: false,
        totalVerified: i,
        tamperedIndex: i,
        reason: `Cryptographic hash mismatch at index ${i} (entity: ${entry.entity}#${entry.entityId}). Data has been tampered with.`,
      };
    }

    expectedPrevHash = entry.currentHash;
  }

  return { valid: true, totalVerified: chain.length };
}
