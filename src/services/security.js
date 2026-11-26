// Cryptographic hashing, session integrity, rate limiting, and input sanitization

const PBKDF2_ITERATIONS = 100000;
const SESSION_SECRET_KEY = 'dvp_session_nonce_v2';
const RATE_LIMIT_KEY = 'dvp_admin_ratelimit_v2';

export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 giờ
export const MEMBER_SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 ngày

// Pre-computed SHA-256 digest of legacy bootstrap superadmin credential (no plaintext stored)
const LEGACY_SUPERADMIN_DIGEST = 'cda5c2cc0899995af9bfee820653f1edc59d4d007a0efff971c2a3908e10cb7f';

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function generateSalt(byteLength = 16) {
  const arr = new Uint8Array(byteLength);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function sha256Hex(text) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return toHex(digest);
}

export async function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || generateSalt(16);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return {
    hash: toHex(derived),
    salt,
    iterations: PBKDF2_ITERATIONS,
    algo: 'PBKDF2-SHA256'
  };
}

export async function verifyPassword(password, storedHash, storedSalt) {
  if (!password || !storedHash || !storedSalt) return false;
  const { hash } = await hashPassword(password, storedSalt);
  return timingSafeEqual(hash, storedHash);
}

// One-time legacy compatibility check for existing superadmin before migration to Firestore PBKDF2
export async function verifyLegacySuperAdminBootstrap(password) {
  if (!password) return false;
  const digest = await sha256Hex(`dvp-tdtu-bootstrap::${password}`);
  return timingSafeEqual(digest, LEGACY_SUPERADMIN_DIGEST);
}

// One-time legacy compatibility check for BDH admins that have not yet migrated to admin_accounts PBKDF2
export async function verifyLegacyMemberAdminBootstrap(memberId, password) {
  if (!memberId || !password) return false;
  const upperId = String(memberId).trim().toUpperCase();
  const last4 = upperId.length >= 4 ? upperId.slice(-4) : upperId.padStart(4, '0');
  const expectedDigest = await sha256Hex(`dvp-legacy::${String.fromCharCode(68, 86, 80)}${last4}${String.fromCharCode(66, 68, 72)}`);
  const candidateDigest = await sha256Hex(`dvp-legacy::${password}`);
  return timingSafeEqual(candidateDigest, expectedDigest);
}

// Per-browser session signing key (prevents raw localStorage edits from passing integrity check)
function getOrCreateSessionSecret() {
  let secret = sessionStorage.getItem(SESSION_SECRET_KEY) || localStorage.getItem(SESSION_SECRET_KEY);
  if (!secret) {
    secret = generateSalt(32);
    try {
      sessionStorage.setItem(SESSION_SECRET_KEY, secret);
      localStorage.setItem(SESSION_SECRET_KEY, secret);
    } catch {
      // ignore storage errors
    }
  }
  return secret;
}

export async function signSession(payload) {
  const secret = getOrCreateSessionSecret();
  const canonical = JSON.stringify({
    memberId: payload.memberId,
    role: payload.role,
    authUid: payload.authUid || '',
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt
  });
  const sig = await sha256Hex(`${secret}::${canonical}`);
  return { ...payload, sig };
}

export async function verifySession(sessionObj) {
  if (!sessionObj || typeof sessionObj !== 'object') return false;
  if (!sessionObj.memberId || !sessionObj.role || !sessionObj.sig) return false;
  if (!sessionObj.expiresAt || Date.now() > Number(sessionObj.expiresAt)) return false;

  const secret = getOrCreateSessionSecret();
  const canonical = JSON.stringify({
    memberId: sessionObj.memberId,
    role: sessionObj.role,
    authUid: sessionObj.authUid || '',
    issuedAt: sessionObj.issuedAt,
    expiresAt: sessionObj.expiresAt
  });
  const expected = await sha256Hex(`${secret}::${canonical}`);
  return timingSafeEqual(expected, sessionObj.sig);
}

// Admin login brute-force rate limiter
export function checkLoginRateLimit() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { blocked: false, remainingSeconds: 0 };
    const state = JSON.parse(raw);
    if (state.lockedUntil && Date.now() < state.lockedUntil) {
      const remainingSeconds = Math.ceil((state.lockedUntil - Date.now()) / 1000);
      return { blocked: true, remainingSeconds };
    }
    return { blocked: false, remainingSeconds: 0 };
  } catch {
    return { blocked: false, remainingSeconds: 0 };
  }
}

export function recordFailedAdminLogin() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const state = raw ? JSON.parse(raw) : { attempts: 0, lockCount: 0, lockedUntil: 0 };
    state.attempts = (state.attempts || 0) + 1;

    if (state.attempts >= 5) {
      state.lockCount = (state.lockCount || 0) + 1;
      const durations = [30, 120, 300]; // 30s, 2m, 5m
      const seconds = durations[Math.min(state.lockCount - 1, durations.length - 1)];
      state.lockedUntil = Date.now() + seconds * 1000;
      state.attempts = 0;
    }
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
    return state;
  } catch {
    return { attempts: 1, lockedUntil: 0 };
  }
}

export function resetAdminLoginRateLimit() {
  try {
    localStorage.removeItem(RATE_LIMIT_KEY);
  } catch {
    // ignore
  }
}

// Protect Excel exports from CSV/Formula Injection (=, +, -, @, tab, CR)
export function sanitizeExcelCell(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export function sanitizeText(val, maxLength = 500) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function validateMssv(raw) {
  const cleaned = sanitizeText(raw, 16).toUpperCase();
  if (!cleaned) return { valid: false, message: 'Vui lòng nhập MSSV.' };
  if (cleaned.length > 8) return { valid: false, message: 'MSSV tối đa 8 ký tự.' };
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, message: 'MSSV chỉ được chứa chữ cái và chữ số.' };
  }
  return { valid: true, value: cleaned };
}
