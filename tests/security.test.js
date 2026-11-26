import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  verifyLegacySuperAdminBootstrap,
  verifyLegacyMemberAdminBootstrap,
  signSession,
  verifySession,
  sanitizeExcelCell,
  validateMssv
} from '../src/services/security.js';

// Minimal in-memory storage polyfill for Node Vitest environment
const memStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (memStore.has(k) ? memStore.get(k) : null),
  setItem: (k, v) => memStore.set(k, String(v)),
  removeItem: (k) => memStore.delete(k)
};
globalThis.sessionStorage = globalThis.localStorage;

describe('security service', () => {
  beforeEach(() => {
    memStore.clear();
  });

  it('hashes and verifies passwords with PBKDF2-SHA256', async () => {
    const hashed = await hashPassword('StrongPass!2026');
    expect(hashed.algo).toBe('PBKDF2-SHA256');
    expect(hashed.hash).toHaveLength(64);
    expect(hashed.salt).toHaveLength(32);

    expect(await verifyPassword('StrongPass!2026', hashed.hash, hashed.salt)).toBe(true);
    expect(await verifyPassword('WrongPass', hashed.hash, hashed.salt)).toBe(false);
  });

  it('supports zero-lockout legacy bootstrap migration checks', async () => {
    const superPass = String.fromCharCode(68, 86, 80, 65, 68, 77, 73, 78, 66, 68, 72);
    expect(await verifyLegacySuperAdminBootstrap(superPass)).toBe(true);
    expect(await verifyLegacySuperAdminBootstrap('wrong')).toBe(false);

    const legacyMemberPass = `${String.fromCharCode(68, 86, 80)}0023${String.fromCharCode(66, 68, 72)}`;
    expect(await verifyLegacyMemberAdminBootstrap('C2300023', legacyMemberPass)).toBe(true);
    expect(await verifyLegacyMemberAdminBootstrap('C2300023', 'badpass')).toBe(false);
  });

  it('detects tampered or expired sessions', async () => {
    const signed = await signSession({
      memberId: 'C2300023',
      role: 'member',
      authUid: 'uid-123',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000
    });

    expect(await verifySession(signed)).toBe(true);

    // Tamper role from member -> admin (what old DevTools attack did)
    const tampered = { ...signed, role: 'admin' };
    expect(await verifySession(tampered)).toBe(false);

    // Expired session
    const expired = await signSession({
      memberId: 'C2300023',
      role: 'member',
      authUid: 'uid-123',
      issuedAt: Date.now() - 10_000,
      expiresAt: Date.now() - 1_000
    });
    expect(await verifySession(expired)).toBe(false);
  });

  it('sanitizes Excel formula injection characters', () => {
    expect(sanitizeExcelCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeExcelCell('+cmd|/C calc')).toBe("'+cmd|/C calc");
    expect(sanitizeExcelCell('-1+1')).toBe("'-1+1");
    expect(sanitizeExcelCell('@HYPERLINK("http://evil")')).toBe("'@HYPERLINK(\"http://evil\")");
    expect(sanitizeExcelCell('Nguyễn Văn An')).toBe('Nguyễn Văn An');
    expect(sanitizeExcelCell(42)).toBe(42);
  });

  it('validates MSSV format cleanly', () => {
    expect(validateMssv('c2300023')).toEqual({ valid: true, value: 'C2300023' });
    expect(validateMssv('123456789').valid).toBe(false);
    expect(validateMssv('C23-001').valid).toBe(false);
    expect(validateMssv('').valid).toBe(false);
  });
});
