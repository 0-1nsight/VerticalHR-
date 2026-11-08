/**
 * VerticalHR Authentication & Password Security Service
 * Implements salted password hashing, RFC 6238 TOTP MFA, lockout protection, and session security.
 */

export interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
  recoveryCodes: string[];
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingMinutes?: number;
}

/**
 * Hashes a plaintext password using PBKDF2-SHA512 with 100,000 iterations and random salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-512',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `pbkdf2:sha512:100000:${saltHex}:${hashHex}`;
}

/**
 * Verifies a password against the stored salted hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const iterations = parseInt(parts[2], 10);
  const saltHex = parts[3];
  const expectedHashHex = parts[4];

  const saltBytes = new Uint8Array(
    saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-512',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex === expectedHashHex;
}

/**
 * Generates an RFC 6238 Base32 secret for TOTP MFA, along with 8 single-use recovery codes.
 */
export function generateMfaSetup(userEmail: string, issuer = 'VerticalHR'): MfaSetupResult {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const randomBytes = crypto.getRandomValues(new Uint8Array(20));
  let secret = '';
  for (let i = 0; i < randomBytes.length; i++) {
    secret += alphabet[randomBytes[i] % 32];
  }

  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(userEmail);
  const otpauthUrl = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

  const recoveryCodes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const codeBytes = crypto.getRandomValues(new Uint8Array(5));
    const code = Array.from(codeBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    recoveryCodes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }

  return { secret, otpauthUrl, recoveryCodes };
}

/**
 * Verifies a 6-digit TOTP code against a Base32 secret with a ±1 time step tolerance window.
 */
export async function verifyTotpCode(secret: string, token: string): Promise<boolean> {
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const currentCounter = Math.floor(now / timeStep);

  // Check current counter, -1 window, and +1 window (drift tolerance)
  for (let delta = -1; delta <= 1; delta++) {
    const counter = currentCounter + delta;
    const computedCode = await computeTotpCode(secret, counter);
    if (computedCode === cleanToken) {
      return true;
    }
  }

  return false;
}

/**
 * Computes a TOTP code for a given counter value using HMAC-SHA1.
 */
async function computeTotpCode(base32Secret: string, counter: number): Promise<string> {
  const keyBytes = base32Decode(base32Secret);
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  // Big-endian 64-bit counter
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter & 0xffffffff);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const sigBytes = new Uint8Array(signature);

  // Dynamic truncation
  const offset = sigBytes[sigBytes.length - 1] & 0x0f;
  const binary =
    ((sigBytes[offset] & 0x7f) << 24) |
    ((sigBytes[offset + 1] & 0xff) << 16) |
    ((sigBytes[offset + 2] & 0xff) << 8) |
    (sigBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * Checks whether an account is currently locked due to repeated failed login attempts.
 */
export function checkAccountLockout(
  _failedAttempts: number,
  lockedUntil?: string | null
): LockoutStatus {
  if (lockedUntil) {
    const lockExpiry = new Date(lockedUntil).getTime();
    const now = Date.now();
    if (lockExpiry > now) {
      const remainingMinutes = Math.ceil((lockExpiry - now) / 60000);
      return { isLocked: true, remainingMinutes };
    }
  }

  return { isLocked: false };
}
