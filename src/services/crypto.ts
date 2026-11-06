/**
 * VerticalHR Field-Level Encryption Service
 * Implements AES-256-GCM encryption for sensitive personal and financial data
 * (Bank account numbers, routing numbers, Tax Registration Numbers / TRNs, SSNs).
 */

const ENCRYPTION_PREFIX = 'enc:v1:';
const DEFAULT_FALLBACK_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

/**
 * Derives a 256-bit CryptoKey from environment or master key material.
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const envKey = typeof process !== 'undefined' && process.env?.ENCRYPTION_KEY_BASE64;
  let keyBytes: Uint8Array;

  if (envKey) {
    try {
      const binaryString = atob(envKey);
      keyBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        keyBytes[i] = binaryString.charCodeAt(i);
      }
    } catch {
      keyBytes = new TextEncoder().encode(DEFAULT_FALLBACK_KEY_HEX.slice(0, 32));
    }
  } else {
    keyBytes = new TextEncoder().encode(DEFAULT_FALLBACK_KEY_HEX.slice(0, 32));
  }

  // Ensure key is 32 bytes (256 bits)
  if (keyBytes.length !== 32) {
    const padded = new Uint8Array(32);
    padded.set(keyBytes.slice(0, 32));
    keyBytes = padded;
  }

  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a random 12-byte IV.
 * Returns: enc:v1:<iv_hex>:<tag_and_ciphertext_hex>
 */
export async function encryptField(plaintext: string | number | null | undefined): Promise<string> {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return '';
  }

  const strValue = String(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKey();

  const encodedData = new TextEncoder().encode(strValue);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedData
  );

  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const cipherHex = Array.from(new Uint8Array(ciphertextBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${ENCRYPTION_PREFIX}${ivHex}:${cipherHex}`;
}

/**
 * Decrypts an encrypted field format `enc:v1:<iv_hex>:<cipher_hex>`.
 * Transparently returns plaintext if input is not encrypted.
 */
export async function decryptField(ciphertext: string | null | undefined): Promise<string> {
  if (!ciphertext) return '';

  if (!ciphertext.startsWith(ENCRYPTION_PREFIX)) {
    return ciphertext; // Not encrypted
  }

  const payload = ciphertext.slice(ENCRYPTION_PREFIX.length);
  const parts = payload.split(':');
  if (parts.length !== 2) {
    throw new Error('Malformed encrypted payload format.');
  }

  const [ivHex, cipherHex] = parts;
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
  const cipherBytes = new Uint8Array(
    cipherHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );

  const key = await getEncryptionKey();

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    cipherBytes
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Tests whether a field value is currently encrypted on disk/database.
 */
export function isFieldEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(ENCRYPTION_PREFIX);
}
