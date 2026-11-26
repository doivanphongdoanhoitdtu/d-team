import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { doc, getDoc, setDoc, deleteDoc, deleteField } from 'firebase/firestore';
import { getDb, ensureAnonymousAuth } from '../services/firebase.js';
import {
  hashPassword,
  verifyPassword,
  verifyLegacySuperAdminBootstrap,
  verifyLegacyMemberAdminBootstrap,
  signSession,
  verifySession,
  checkLoginRateLimit,
  recordFailedAdminLogin,
  resetAdminLoginRateLimit,
  validateMssv,
  ADMIN_SESSION_TTL_MS,
  MEMBER_SESSION_TTL_MS
} from '../services/security.js';
import { isMemberAdminRole } from '../utils/normalizers.js';
import { useUiStore } from './ui.js';
import { useDataStore } from './data.js';

const SESSION_KEY = 'dvp_signed_session_v2';

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false);
  const currentUserRole = ref('member'); // 'member' | 'admin'
  const loggedInMemberId = ref('');
  const authUid = ref('');
  const isAuthenticating = ref(false);
  const needsPasswordUpgradeNotice = ref(false);

  const isAdmin = computed(() => isLoggedIn.value && currentUserRole.value === 'admin');

  async function persistSignedSession(memberId, role, uid) {
    const now = Date.now();
    const ttl = role === 'admin' ? ADMIN_SESSION_TTL_MS : MEMBER_SESSION_TTL_MS;
    const signed = await signSession({
      memberId,
      role,
      authUid: uid || '',
      issuedAt: now,
      expiresAt: now + ttl
    });

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(signed));
      // Clean legacy insecure keys so nobody relies on them
      localStorage.removeItem('socatruc_is_logged_in');
      localStorage.removeItem('socatruc_user_role');
      localStorage.removeItem('socatruc_member_id');
    } catch {
      // ignore
    }

    // Record admin session in Firestore bound to Firebase Auth UID (enforced by firestore.rules)
    const db = getDb();
    if (role === 'admin' && db && uid) {
      try {
        await setDoc(doc(db, 'sessions', uid), {
          memberId,
          role: 'admin',
          createdAt: new Date(now).toISOString(),
          expiresAt: new Date(now + ttl).toISOString()
        });
      } catch (err) {
        console.warn('[Auth] Không thể ghi session Firestore:', err?.message || err);
      }
    }
  }

  async function clearSession() {
    const db = getDb();
    const uid = authUid.value;
    if (db && uid && currentUserRole.value === 'admin') {
      try {
        await deleteDoc(doc(db, 'sessions', uid));
      } catch {
        // ignore
      }
    }
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('socatruc_is_logged_in');
      localStorage.removeItem('socatruc_user_role');
      localStorage.removeItem('socatruc_member_id');
    } catch {
      // ignore
    }
    isLoggedIn.value = false;
    currentUserRole.value = 'member';
    loggedInMemberId.value = '';
    needsPasswordUpgradeNotice.value = false;
  }

  async function restoreSession() {
    const uid = await ensureAnonymousAuth();
    authUid.value = uid || '';

    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const valid = await verifySession(parsed);
      if (!valid) {
        await clearSession();
        return false;
      }

      // If admin session, also verify server-side session record matches current auth UID when online
      if (parsed.role === 'admin') {
        const db = getDb();
        if (db && uid) {
          try {
            const snap = await getDoc(doc(db, 'sessions', uid));
            if (snap.exists()) {
              const sData = snap.data();
              const isExpired = sData.expiresAt && new Date(sData.expiresAt).getTime() < Date.now();
              if (sData.role !== 'admin' || sData.memberId !== parsed.memberId || isExpired) {
                await clearSession();
                return false;
              }
            }
          } catch {
            // Allow offline cached signed session if Firestore temporarily unreachable
          }
        }
      }

      isLoggedIn.value = true;
      currentUserRole.value = parsed.role === 'admin' ? 'admin' : 'member';
      loggedInMemberId.value = parsed.memberId;
      return true;
    } catch {
      await clearSession();
      return false;
    }
  }

  // Verify admin password with PBKDF2-SHA256 & seamless one-time legacy migration
  async function verifyAndMigrateAdminCredential(canonicalId, password, isSuperAdmin, memberObj) {
    const db = getDb();
    const docKey = isSuperAdmin ? 'ADMIN' : canonicalId;
    let adminDoc = null;

    if (db) {
      try {
        const snap = await getDoc(doc(db, 'admin_accounts', docKey));
        if (snap.exists()) {
          adminDoc = snap.data();
        } else if (!isSuperAdmin && memberObj?.docId && memberObj.docId !== docKey) {
          const altSnap = await getDoc(doc(db, 'admin_accounts', memberObj.docId));
          if (altSnap.exists()) adminDoc = altSnap.data();
        }
      } catch (err) {
        console.warn('[Auth] Không thể đọc admin_accounts:', err?.message || err);
      }
    }

    // 1. Modern PBKDF2-SHA256 verification
    if (adminDoc?.passwordHash && adminDoc?.passwordSalt) {
      const ok = await verifyPassword(password, adminDoc.passwordHash, adminDoc.passwordSalt);
      return { ok, migrated: false };
    }

    // 2. Legacy plaintext migration in existing admin_accounts doc
    if (adminDoc?.password && typeof adminDoc.password === 'string') {
      if (password === adminDoc.password) {
        if (db) {
          try {
            const hashed = await hashPassword(password);
            await setDoc(doc(db, 'admin_accounts', docKey), {
              id: docKey,
              name: adminDoc.name || memberObj?.name || (isSuperAdmin ? 'Super Admin' : canonicalId),
              department: adminDoc.department || memberObj?.department || 'Ban Điều hành',
              role: 'admin',
              passwordHash: hashed.hash,
              passwordSalt: hashed.salt,
              hashAlgo: hashed.algo,
              password: deleteField(),
              migratedAt: new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            console.warn('[Auth] Lỗi nâng cấp hash mật khẩu:', err?.message || err);
          }
        }
        return { ok: true, migrated: true };
      }
      return { ok: false, migrated: false };
    }

    // 3. First-time bootstrap for superadmin or BDH admin without an admin_accounts doc yet
    const legacyOk = isSuperAdmin
      ? await verifyLegacySuperAdminBootstrap(password)
      : await verifyLegacyMemberAdminBootstrap(canonicalId, password);

    if (legacyOk) {
      if (db) {
        try {
          const hashed = await hashPassword(password);
          await setDoc(doc(db, 'admin_accounts', docKey), {
            id: docKey,
            name: memberObj?.name || (isSuperAdmin ? 'Super Admin' : canonicalId),
            department: memberObj?.department || 'Ban Điều hành',
            role: 'admin',
            passwordHash: hashed.hash,
            passwordSalt: hashed.salt,
            hashAlgo: hashed.algo,
            migratedAt: new Date().toISOString()
          }, { merge: true });
        } catch {
          // ignore
        }
      }
      return { ok: true, migrated: true };
    }

    return { ok: false, migrated: false };
  }

  async function login({ role, memberId, password }) {
    const ui = useUiStore();
    const data = useDataStore();

    const check = validateMssv(memberId);
    if (!check.valid) {
      ui.showToast(check.message, 'error');
      return false;
    }

    const upperId = check.value;
    const isSuperAdmin = upperId === 'ADMIN';

    if (!isSuperAdmin && data.members.length === 0) {
      ui.showToast('Danh sách thành viên đang được tải từ máy chủ, vui lòng thử lại sau giây lát.', 'warning');
      return false;
    }

    const cloudMember = data.findMember(upperId);
    if (!cloudMember && !isSuperAdmin) {
      ui.showToast(`MSSV ${upperId} không có trong danh sách thành viên của Đội.`, 'error');
      return false;
    }

    const canonicalId = cloudMember ? cloudMember.id : upperId;
    isAuthenticating.value = true;

    try {
      const uid = await ensureAnonymousAuth();
      authUid.value = uid || '';

      if (role === 'admin') {
        const rate = checkLoginRateLimit();
        if (rate.blocked) {
          ui.showToast(`Nhập sai quá nhiều lần. Vui lòng thử lại sau ${rate.remainingSeconds} giây.`, 'error');
          return false;
        }

        const pwd = String(password || '').trim();
        if (!pwd) {
          ui.showToast('Vui lòng nhập mật khẩu Quản trị viên.', 'error');
          return false;
        }

        const isAuthorizedAdmin = isSuperAdmin || isMemberAdminRole(cloudMember);
        if (!isAuthorizedAdmin) {
          ui.showToast(`Tài khoản ${canonicalId} không có quyền Quản trị viên.`, 'error');
          return false;
        }

        const { ok, migrated } = await verifyAndMigrateAdminCredential(canonicalId, pwd, isSuperAdmin, cloudMember);
        if (!ok) {
          const state = recordFailedAdminLogin();
          if (state.lockedUntil && state.lockedUntil > Date.now()) {
            const secs = Math.ceil((state.lockedUntil - Date.now()) / 1000);
            ui.showToast(`Sai mật khẩu nhiều lần. Tạm khóa đăng nhập quản trị trong ${secs} giây.`, 'error');
          } else {
            ui.showToast('Mật khẩu Quản trị viên không chính xác.', 'error');
          }
          return false;
        }

        resetAdminLoginRateLimit();
        await persistSignedSession(canonicalId, 'admin', uid);
        isLoggedIn.value = true;
        currentUserRole.value = 'admin';
        loggedInMemberId.value = canonicalId;
        needsPasswordUpgradeNotice.value = migrated;
        ui.currentTab = 'activities';

        const displayName = isSuperAdmin ? 'Quản trị hệ thống' : (cloudMember?.name || canonicalId);
        ui.showToast(
          migrated
            ? `Đăng nhập thành công (${displayName}). Mật khẩu đã được mã hóa PBKDF2, bạn nên đổi mật khẩu mạnh hơn.`
            : `Đăng nhập Quản trị viên thành công (${displayName}).`,
          'success'
        );
        return true;
      }

      // Member login — passwordless MSSV-only (per user preference)
      await persistSignedSession(canonicalId, 'member', uid);
      isLoggedIn.value = true;
      currentUserRole.value = 'member';
      loggedInMemberId.value = canonicalId;
      ui.currentTab = 'activities';

      const displayName = cloudMember?.name || canonicalId;
      ui.showToast(`Xin chào ${displayName} (${canonicalId}).`, 'success');
      return true;
    } finally {
      isAuthenticating.value = false;
    }
  }

  async function changeAdminPassword(currentPassword, newPassword) {
    const ui = useUiStore();
    if (!isAdmin.value) {
      ui.showToast('Chỉ Quản trị viên mới có quyền đổi mật khẩu.', 'error');
      return false;
    }
    if (!newPassword || newPassword.trim().length < 8) {
      ui.showToast('Mật khẩu mới phải có tối thiểu 8 ký tự.', 'error');
      return false;
    }

    const db = getDb();
    if (!db) {
      ui.showToast('Chưa kết nối máy chủ Cloud.', 'error');
      return false;
    }

    const data = useDataStore();
    const isSuperAdmin = loggedInMemberId.value === 'ADMIN';
    const memberObj = data.findMember(loggedInMemberId.value);
    const { ok } = await verifyAndMigrateAdminCredential(
      loggedInMemberId.value,
      String(currentPassword || '').trim(),
      isSuperAdmin,
      memberObj
    );
    if (!ok) {
      ui.showToast('Mật khẩu hiện tại không đúng.', 'error');
      return false;
    }

    const docKey = isSuperAdmin ? 'ADMIN' : loggedInMemberId.value;
    const hashed = await hashPassword(newPassword.trim());
    await setDoc(doc(db, 'admin_accounts', docKey), {
      id: docKey,
      name: memberObj?.name || (isSuperAdmin ? 'Super Admin' : loggedInMemberId.value),
      department: memberObj?.department || 'Ban Điều hành',
      role: 'admin',
      passwordHash: hashed.hash,
      passwordSalt: hashed.salt,
      hashAlgo: hashed.algo,
      password: deleteField(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    needsPasswordUpgradeNotice.value = false;
    ui.showToast('Đã cập nhật mật khẩu Quản trị viên (mã hóa PBKDF2-SHA256).', 'success');
    return true;
  }

  async function setMemberAdminCredential(memberId, memberName, department, customPassword = '') {
    const db = getDb();
    if (!db) return;
    const docKey = String(memberId).trim().toUpperCase();
    const pwd = String(customPassword || '').trim();
    if (!pwd) return; // Don't overwrite existing credential if admin didn't enter a new password
    const hashed = await hashPassword(pwd);
    await setDoc(doc(db, 'admin_accounts', docKey), {
      id: docKey,
      name: memberName,
      department: department || 'Ban Điều hành',
      role: 'admin',
      passwordHash: hashed.hash,
      passwordSalt: hashed.salt,
      hashAlgo: hashed.algo,
      password: deleteField(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  async function revokeMemberAdminCredential(memberId) {
    const db = getDb();
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'admin_accounts', String(memberId).trim().toUpperCase()));
    } catch {
      // ignore
    }
  }

  async function logout() {
    const ui = useUiStore();
    await clearSession();
    ui.currentTab = 'activities';
    ui.showToast('Đã đăng xuất khỏi hệ thống.', 'info');
  }

  return {
    isLoggedIn,
    currentUserRole,
    loggedInMemberId,
    authUid,
    isAdmin,
    isAuthenticating,
    needsPasswordUpgradeNotice,
    restoreSession,
    login,
    logout,
    changeAdminPassword,
    setMemberAdminCredential,
    revokeMemberAdminCredential
  };
});
