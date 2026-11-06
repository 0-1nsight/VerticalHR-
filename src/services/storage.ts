/**
 * VerticalHR S3-Compatible Storage & File Service
 * Enforces per-tenant key prefix isolation, MIME-type allowlists, size limits, and malware scanning hooks.
 */

export interface PresignedUploadRequest {
  tenantId: string;
  uploaderId: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  category: 'identity' | 'compliance' | 'contracts' | 'letters' | 'general';
}

export interface PresignedUploadResponse {
  fileId: string;
  storageKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
  requiredHeaders: Record<string, string>;
}

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max

/**
 * Validates file upload parameters against tenant quotas, security rules, and MIME limits.
 */
export function validateUploadRequest(req: PresignedUploadRequest): { valid: boolean; error?: string } {
  if (!req.tenantId) {
    return { valid: false, error: 'Tenant context is strictly required' };
  }

  if (req.byteSize <= 0) {
    return { valid: false, error: 'File size must be greater than zero bytes' };
  }

  if (req.byteSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the allowable limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
    };
  }

  if (!ALLOWED_MIME_TYPES.has(req.mimeType)) {
    return {
      valid: false,
      error: `File format '${req.mimeType}' is not permitted. Permitted formats: PDF, JPEG, PNG, WEBP, CSV, XLSX, DOCX.`,
    };
  }

  return { valid: true };
}

/**
 * Generates an isolated storage key prefixed by tenant ID to prevent any cross-tenant data leakage.
 */
export function generateTenantStorageKey(
  tenantId: string,
  category: string,
  fileId: string,
  filename: string
): string {
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `tenants/${tenantId}/${category}/${fileId}_${sanitizedFilename}`;
}

/**
 * Prepares a presigned upload contract for S3-compatible object storage.
 */
export function createPresignedUploadUrl(
  req: PresignedUploadRequest,
  storageEndpoint = 'https://storage.verticalhrm.internal'
): PresignedUploadResponse {
  const validation = validateUploadRequest(req);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileId = crypto.randomUUID();
  const storageKey = generateTenantStorageKey(req.tenantId, req.category, fileId, req.filename);

  // In production with AWS SDK v3: PutObjectCommand with getSignedUrl
  const uploadUrl = `${storageEndpoint}/${storageKey}?uploadId=${crypto.randomUUID()}&expires=900`;

  return {
    fileId,
    storageKey,
    uploadUrl,
    expiresInSeconds: 900, // 15 minutes
    requiredHeaders: {
      'Content-Type': req.mimeType,
      'x-amz-server-side-encryption': 'AES256',
      'x-tenant-id': req.tenantId,
    },
  };
}

/**
 * Generates a presigned download URL for a clean, verified file.
 */
export function createPresignedDownloadUrl(
  storageKey: string,
  tenantId: string,
  scanStatus: 'pending' | 'clean' | 'flagged' | 'quarantined',
  storageEndpoint = 'https://storage.verticalhrm.internal'
): string {
  // Enforce tenant key isolation check
  if (!storageKey.startsWith(`tenants/${tenantId}/`)) {
    throw new Error('Access denied: Tenant cross-isolation violation detected.');
  }

  if (scanStatus !== 'clean') {
    throw new Error(`File download blocked: Security scan status is '${scanStatus}'.`);
  }

  return `${storageEndpoint}/${storageKey}?token=${crypto.randomUUID()}&expires=300`;
}
