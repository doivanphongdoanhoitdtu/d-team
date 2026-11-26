import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { initFirebase, getDb, ensureAnonymousAuth } from '../services/firebase.js';
import { sanitizeText } from '../services/security.js';
import {
  getTodayStr,
  getActiveWindowMinDate,
  addDays,
  formatDate,
  formatCheckInTime,
  getDateRange,
  isDateInSelectedMonth,
  isDateInSelectedWeek
} from '../utils/date.js';
import {
  DEFAULT_SHIFT_SETTINGS,
  normalizeMember,
  normalizeShift,
  normalizeRegistration,
  normalizeLeaveRequest,
  normalizeActivity,
  normalizeCheckIn,
  normalizeActivityRegistration,
  normalizeShiftSettings
} from '../utils/normalizers.js';
import { useUiStore } from './ui.js';
import { useAuthStore } from './auth.js';

export const GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1zbUHwDzxXVfYK_kTIdQvVZXYJ2sVMBsd';
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbymKPkZlGwOwHSW1wiUoyNRKvsNnaevzPXZ-EvXHDa4Nauc5iAjjblCJet7Bg62quLE/exec';

export const useDataStore = defineStore('data', () => {
  // Core domain collections
  const members = ref([]);
  const shifts = ref([]);
  const registrations = ref([]);
  const leaveRequests = ref([]);
  const activities = ref([]);
  const activityCheckIns = ref([]);
  const activityRegistrations = ref([]);
  const semesters = ref([]);
  const departments = ref([]);
  const shiftSettings = ref(JSON.parse(JSON.stringify(DEFAULT_SHIFT_SETTINGS)));

  // Connection & caching metadata
  const isCloudConnected = ref(false);
  const hasQuotaWarning = ref(false);
  const fetchedArchiveMonths = new Set();
  const proofCache = new Map(); // in-memory lazy cache: checkinId -> base64 string

  let unsubscribers = [];
  let isInitializing = false;
  let hasInitialized = false;

  // O(1) Member lookup Map
  const memberMap = computed(() => {
    const map = new Map();
    for (const m of members.value) {
      if (m?.id) map.set(m.id.toUpperCase(), m);
    }
    return map;
  });

  function findMember(id) {
    if (!id) return null;
    return memberMap.value.get(String(id).trim().toUpperCase()) || null;
  }

  function getMemberName(id) {
    if (!id) return '';
    const key = String(id).trim().toUpperCase();
    return memberMap.value.get(key)?.name || key;
  }

  function getMemberDept(id) {
    if (!id) return '—';
    const key = String(id).trim().toUpperCase();
    return memberMap.value.get(key)?.department || '—';
  }

  const shiftTypes = computed(() => {
    return shiftSettings.value?.shiftTypes?.length
      ? shiftSettings.value.shiftTypes
      : DEFAULT_SHIFT_SETTINGS.shiftTypes;
  });

  const shiftTypeNames = computed(() => shiftTypes.value.map((st) => st.name || st.id));

  // Merge active window snapshot with archived older records in memory
  function mergeWindowed(existingList, incomingList, minDate, dateGetter, keyGetter, sortFn) {
    const map = new Map();
    for (const item of existingList) {
      const d = dateGetter(item);
      if (d && d < minDate) {
        map.set(keyGetter(item), item);
      }
    }
    for (const item of incomingList) {
      map.set(keyGetter(item), item);
    }
    return Array.from(map.values()).sort(sortFn);
  }

  function teardownListeners() {
    for (const unsub of unsubscribers) {
      try {
        unsub();
      } catch {
        // ignore
      }
    }
    unsubscribers = [];
    hasInitialized = false;
  }

  async function initCloud(force = false) {
    const ui = useUiStore();
    if (isInitializing) return;
    if (hasInitialized && !force) return;

    isInitializing = true;
    try {
      if (force) {
        teardownListeners();
        fetchedArchiveMonths.clear();
      }

      const { db } = await initFirebase(null, force);
      await ensureAnonymousAuth();

      const minDate = getActiveWindowMinDate();
      const minIso = `${minDate}T00:00:00.000Z`;

      const handleErr = (err) => {
        console.warn('[Firestore listener]', err?.code || err?.message);
        isCloudConnected.value = false;
        if (err && (err.code === 'resource-exhausted' || String(err.message || '').includes('Quota'))) {
          if (!hasQuotaWarning.value) {
            hasQuotaWarning.value = true;
            ui.showToast('Firestore tạm chạm hạn mức đọc hôm nay. Dữ liệu offline đang được sử dụng.', 'warning', 5000);
          }
        }
      };

      // 1. Members
      unsubscribers.push(
        onSnapshot(collection(db, 'members'), (snap) => {
          const map = new Map();
          snap.forEach((d) => {
            const norm = normalizeMember(d.data(), d.id);
            if (!norm) return;
            const prev = map.get(norm.id);
            if (!prev || (prev.name === prev.id && norm.name !== norm.id)) {
              map.set(norm.id, norm);
            }
          });
          members.value = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
          isCloudConnected.value = true;
        }, handleErr)
      );

      // 2. Shifts (active 2-month window)
      unsubscribers.push(
        onSnapshot(query(collection(db, 'shifts'), where('date', '>=', minDate)), (snap) => {
          const incoming = [];
          snap.forEach((d) => {
            const norm = normalizeShift(d.data(), d.id);
            if (norm) incoming.push(norm);
          });
          shifts.value = mergeWindowed(
            shifts.value,
            incoming,
            minDate,
            (s) => s.date,
            (s) => s.id,
            (a, b) => (b.date || '').localeCompare(a.date || '')
          );
          isCloudConnected.value = true;
        }, handleErr)
      );

      // 3. Registrations (active window)
      unsubscribers.push(
        onSnapshot(query(collection(db, 'registrations'), where('date', '>=', minDate)), (snap) => {
          const incoming = [];
          snap.forEach((d) => {
            const norm = normalizeRegistration(d.data(), d.id);
            if (norm) incoming.push(norm);
          });
          registrations.value = mergeWindowed(
            registrations.value,
            incoming,
            minDate,
            (r) => r.date,
            (r) => r.id,
            (a, b) => (b.date || '').localeCompare(a.date || '')
          );
          isCloudConnected.value = true;
        }, handleErr)
      );

      // 4. Leave Requests — FIXED: listen on BOTH shiftDate and legacy date field so zero docs are missed!
      const leaveByShiftDate = new Map();
      const leaveByDate = new Map();
      const rebuildLeaves = () => {
        const incoming = new Map();
        leaveByDate.forEach((v, k) => incoming.set(k, v));
        leaveByShiftDate.forEach((v, k) => incoming.set(k, v));
        leaveRequests.value = mergeWindowed(
          leaveRequests.value,
          Array.from(incoming.values()),
          minDate,
          (l) => l.shiftDate || l.date,
          (l) => l.id,
          (a, b) => String(b.createdAt || b.shiftDate || '').localeCompare(String(a.createdAt || a.shiftDate || ''))
        );
        isCloudConnected.value = true;
      };

      unsubscribers.push(
        onSnapshot(query(collection(db, 'leave_requests'), where('shiftDate', '>=', minDate)), (snap) => {
          leaveByShiftDate.clear();
          snap.forEach((d) => {
            const norm = normalizeLeaveRequest(d.data(), d.id);
            if (norm) leaveByShiftDate.set(norm.id, norm);
          });
          rebuildLeaves();
        }, handleErr)
      );

      unsubscribers.push(
        onSnapshot(query(collection(db, 'leave_requests'), where('date', '>=', minDate)), (snap) => {
          leaveByDate.clear();
          snap.forEach((d) => {
            const norm = normalizeLeaveRequest(d.data(), d.id);
            if (norm) leaveByDate.set(norm.id, norm);
          });
          rebuildLeaves();
        }, handleErr)
      );

      // 5. Activities (active window)
      unsubscribers.push(
        onSnapshot(query(collection(db, 'activities'), where('date', '>=', minDate)), (snap) => {
          const incoming = [];
          snap.forEach((d) => {
            const norm = normalizeActivity(d.data(), d.id);
            if (norm) incoming.push(norm);
          });
          activities.value = mergeWindowed(
            activities.value,
            incoming,
            minDate,
            (a) => a.date,
            (a) => a.id,
            (a, b) => (b.date || '').localeCompare(a.date || '')
          );
          isCloudConnected.value = true;
        }, handleErr)
      );

      // 6. Activity Check-ins (windowed by timestamp to save Spark quota)
      unsubscribers.push(
        onSnapshot(query(collection(db, 'activity_checkins'), where('timestamp', '>=', minIso)), (snap) => {
          const incoming = [];
          snap.forEach((d) => {
            const norm = normalizeCheckIn(d.data(), d.id);
            if (norm) incoming.push(norm);
          });
          activityCheckIns.value = mergeWindowed(
            activityCheckIns.value,
            incoming,
            minIso,
            (c) => c.timestamp,
            (c) => c.id,
            (a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || ''))
          );
          isCloudConnected.value = true;
        }, handleErr)
      );

      // 7. Activity Registrations (active window)
      unsubscribers.push(
        onSnapshot(query(collection(db, 'activity_registrations'), where('date', '>=', minDate)), (snap) => {
          const incoming = [];
          snap.forEach((d) => {
            const norm = normalizeActivityRegistration(d.data(), d.id);
            if (norm) incoming.push(norm);
          });
          activityRegistrations.value = mergeWindowed(
            activityRegistrations.value,
            incoming,
            minDate,
            (r) => r.date,
            (r) => r.id,
            (a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || ''))
          );
          isCloudConnected.value = true;
        }, handleErr)
      );

      // 8. App Config docs
      unsubscribers.push(
        onSnapshot(doc(db, 'app_config', 'semesters'), (snap) => {
          if (snap.exists() && Array.isArray(snap.data()?.list)) {
            semesters.value = snap.data().list;
          }
        }, () => {})
      );

      unsubscribers.push(
        onSnapshot(doc(db, 'app_config', 'departments'), (snap) => {
          if (snap.exists() && Array.isArray(snap.data()?.list)) {
            departments.value = snap.data().list;
          }
        }, () => {})
      );

      unsubscribers.push(
        onSnapshot(doc(db, 'app_config', 'shift_settings'), (snap) => {
          if (snap.exists()) {
            shiftSettings.value = normalizeShiftSettings(snap.data());
          }
        }, () => {})
      );

      hasInitialized = true;
    } catch (err) {
      console.warn('[Cloud init error]', err);
      isCloudConnected.value = false;
    } finally {
      isInitializing = false;
    }
  }

  // On-demand archive loader when user selects an older month
  async function fetchArchiveMonth(monthStr) {
    const db = getDb();
    if (!monthStr || !db) return;
    const minDate = getActiveWindowMinDate();
    if (monthStr >= minDate.substring(0, 7)) return;
    if (fetchedArchiveMonths.has(monthStr)) return;
    fetchedArchiveMonths.add(monthStr);

    const start = `${monthStr}-01`;
    const end = `${monthStr}-31`;
    const startIso = `${start}T00:00:00.000Z`;
    const endIso = `${end}T23:59:59.999Z`;

    try {
      const [snapS, snapR, snapA, snapAR, snapL, snapC] = await Promise.all([
        getDocs(query(collection(db, 'shifts'), where('date', '>=', start), where('date', '<=', end))),
        getDocs(query(collection(db, 'registrations'), where('date', '>=', start), where('date', '<=', end))),
        getDocs(query(collection(db, 'activities'), where('date', '>=', start), where('date', '<=', end))),
        getDocs(query(collection(db, 'activity_registrations'), where('date', '>=', start), where('date', '<=', end))),
        getDocs(query(collection(db, 'leave_requests'), where('shiftDate', '>=', start), where('shiftDate', '<=', end))),
        getDocs(query(collection(db, 'activity_checkins'), where('timestamp', '>=', startIso), where('timestamp', '<=', endIso)))
      ]);

      const mergeById = (refArr, snap, normalizer, sortFn) => {
        if (snap.empty) return;
        const map = new Map(refArr.value.map((x) => [x.id, x]));
        snap.forEach((d) => {
          const n = normalizer(d.data(), d.id);
          if (n) map.set(n.id, n);
        });
        refArr.value = Array.from(map.values()).sort(sortFn);
      };

      mergeById(shifts, snapS, normalizeShift, (a, b) => (b.date || '').localeCompare(a.date || ''));
      mergeById(registrations, snapR, normalizeRegistration, (a, b) => (b.date || '').localeCompare(a.date || ''));
      mergeById(activities, snapA, normalizeActivity, (a, b) => (b.date || '').localeCompare(a.date || ''));
      mergeById(activityRegistrations, snapAR, normalizeActivityRegistration, (a, b) => (b.date || '').localeCompare(a.date || ''));
      mergeById(leaveRequests, snapL, normalizeLeaveRequest, (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      mergeById(activityCheckIns, snapC, normalizeCheckIn, (a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
    } catch (err) {
      fetchedArchiveMonths.delete(monthStr);
      console.warn('[Archive fetch error]', monthStr, err);
    }
  }

  // Lazy load proof image (supports BOTH legacy inline proofImage AND new separate activity_proofs collection)
  async function fetchProofImage(checkInItem) {
    if (!checkInItem) return '';
    if (checkInItem.proofImage) return checkInItem.proofImage;
    if (proofCache.has(checkInItem.id)) return proofCache.get(checkInItem.id);

    const db = getDb();
    if (!db) return '';
    try {
      const snap = await getDoc(doc(db, 'activity_proofs', checkInItem.id));
      if (snap.exists() && snap.data()?.proofImage) {
        const img = snap.data().proofImage;
        proofCache.set(checkInItem.id, img);
        return img;
      }
    } catch (err) {
      console.warn('[Proof fetch error]', err);
    }
    return '';
  }

  // =========================================================================
  // SHIFTS & REGISTRATIONS
  // =========================================================================
  function getShiftRegisteredCount(shiftType, dateStr) {
    if (!dateStr || !shiftType) return 0;
    return registrations.value.filter((r) => r.date === dateStr && r.shiftType === shiftType).length;
  }

  function isShiftFullOnDate(shiftType, dateStr) {
    const max = Number(shiftSettings.value?.maxPerShift) || 0;
    if (max <= 0) return false;
    return getShiftRegisteredCount(shiftType, dateStr) >= max;
  }

  function getTakenShiftsCountForDate(dateStr) {
    if (!dateStr) return 0;
    return shiftTypeNames.value.filter((st) => isShiftFullOnDate(st, dateStr)).length;
  }

  function isDateFull(dateStr) {
    const max = Number(shiftSettings.value?.maxPerShift) || 0;
    if (!dateStr || max <= 0 || shiftTypeNames.value.length === 0) return false;
    return getTakenShiftsCountForDate(dateStr) >= shiftTypeNames.value.length;
  }

  async function saveShift(formPayload) {
    const ui = useUiStore();
    const auth = useAuthStore();
    const today = getTodayStr();

    const memberId = auth.isAdmin
      ? String(formPayload.memberId || '').trim().toUpperCase()
      : auth.loggedInMemberId;
    const date = auth.isAdmin ? formPayload.date : today;
    const shiftType = formPayload.shiftType;
    const pageNo = Number(formPayload.pageNo);
    const sttNo = Number(formPayload.sttNo);

    if (!memberId) return ui.showToast('Vui lòng chọn thành viên trực.', 'error');
    if (!date) return ui.showToast('Vui lòng chọn ngày trực.', 'error');
    if (!pageNo || pageNo < 1 || !sttNo || sttNo < 1) {
      return ui.showToast('Vui lòng nhập Trang số và STT sổ gốc hợp lệ.', 'error');
    }

    if (!auth.isAdmin) {
      if (date !== today) {
        return ui.showToast('Chỉ được điểm danh ca trực trong ngày hôm nay.', 'error');
      }
      const isReg = registrations.value.some(
        (r) => r.memberId === memberId && r.date === date && r.shiftType === shiftType
      );
      if (!isReg) {
        return ui.showToast(`Bạn chưa đăng ký ${shiftType} ngày ${formatDate(date)}.`, 'error');
      }
      const already = shifts.value.some(
        (s) => s.memberId === memberId && s.date === date && s.shiftType === shiftType
      );
      if (already) {
        return ui.showToast(`Ca trực ${shiftType} hôm nay đã được điểm danh.`, 'error');
      }
    }

    const newId = `s_${Date.now()}`;
    const record = {
      id: newId,
      memberId,
      date,
      shiftType,
      pageNo,
      sttNo,
      status: formPayload.status || 'Đúng giờ',
      notes: sanitizeText(formPayload.notes || '', 300),
      createdAt: new Date().toISOString()
    };

    const db = getDb();
    if (db) {
      await setDoc(doc(db, 'shifts', newId), record);
    } else {
      shifts.value.unshift(record);
    }
    ui.showToast('Đã ghi nhận điểm danh ca trực thành công.', 'success');
    return true;
  }

  async function saveRegistration(formPayload) {
    const ui = useUiStore();
    const auth = useAuthStore();
    const today = getTodayStr();

    if (!auth.isAdmin && shiftSettings.value?.isRegistrationOpen === false) {
      ui.showToast('Cổng đăng ký ca trực hiện đang tạm đóng.', 'error');
      return false;
    }

    const memberId = auth.isAdmin
      ? String(formPayload.memberId || '').trim().toUpperCase()
      : auth.loggedInMemberId;
    const date = formPayload.date;
    const shiftType = formPayload.shiftType;

    if (!memberId) return ui.showToast('Vui lòng chọn thành viên đăng ký.', 'error');
    if (!date) return ui.showToast('Vui lòng chọn ngày đăng ký.', 'error');
    if (!auth.isAdmin && date < today) {
      return ui.showToast('Không thể đăng ký ca trực cho ngày trong quá khứ.', 'error');
    }

    const dup = registrations.value.some(
      (r) => r.memberId === memberId && r.date === date && r.shiftType === shiftType
    );
    if (dup) {
      return ui.showToast(`Thành viên đã đăng ký ${shiftType} ngày ${formatDate(date)}.`, 'error');
    }

    if (isShiftFullOnDate(shiftType, date)) {
      return ui.showToast(`Ca ${shiftType} ngày ${formatDate(date)} đã đủ số lượng người.`, 'error');
    }

    const maxPerDay = Number(shiftSettings.value?.maxPerDay) || 0;
    if (maxPerDay > 0) {
      const countForDay = registrations.value.filter((r) => r.memberId === memberId && r.date === date).length;
      if (countForDay >= maxPerDay) {
        return ui.showToast(`Tối đa ${maxPerDay} ca trực trong cùng một ngày.`, 'error');
      }
    }

    const newId = `r_${Date.now()}`;
    const record = {
      id: newId,
      memberId,
      date,
      shiftType,
      notes: sanitizeText(formPayload.notes || '', 300),
      createdAt: new Date().toISOString()
    };

    const db = getDb();
    if (db) {
      await setDoc(doc(db, 'registrations', newId), record);
    } else {
      registrations.value.unshift(record);
    }
    ui.showToast(`Đã đăng ký ${shiftType} ngày ${formatDate(date)}.`, 'success');
    return record;
  }

  async function deleteRegistration(regId) {
    const ui = useUiStore();
    const auth = useAuthStore();
    if (!auth.isAdmin) {
      ui.showToast('Thành viên cần gửi đơn xin nghỉ phép để Quản trị viên duyệt hủy ca.', 'error');
      return false;
    }
    const db = getDb();
    if (db) {
      await deleteDoc(doc(db, 'registrations', regId));
    }
    registrations.value = registrations.value.filter((r) => r.id !== regId);
    ui.showToast('Đã hủy lịch đăng ký ca trực.', 'success');
    return true;
  }

  async function saveShiftSettings(newSettings) {
    const ui = useUiStore();
    const auth = useAuthStore();
    if (!auth.isAdmin) return ui.showToast('Chỉ Quản trị viên có quyền thay đổi cấu hình.', 'error');

    const normalized = normalizeShiftSettings(newSettings);
    shiftSettings.value = normalized;
    const db = getDb();
    if (db) {
      await setDoc(doc(db, 'app_config', 'shift_settings'), normalized);
    }
    ui.showToast('Đã lưu cấu hình ca trực.', 'success');
    return true;
  }

  async function toggleRegistrationOpen() {
    const ui = useUiStore();
    const auth = useAuthStore();
    if (!auth.isAdmin) return;
    const next = !(shiftSettings.value?.isRegistrationOpen !== false);
    const updated = { ...shiftSettings.value, isRegistrationOpen: next };
    shiftSettings.value = updated;
    const db = getDb();
    if (db) {
      await setDoc(doc(db, 'app_config', 'shift_settings'), updated);
    }
    ui.showToast(next ? 'Đã mở cổng đăng ký ca trực.' : 'Đã tạm đóng cổng đăng ký ca trực.', 'info');
  }

  // =========================================================================
  // LEAVE REQUESTS (Regular Shifts + Activities)
  // =========================================================================
  async function saveLeaveRequest(payload) {
    const ui = useUiStore();
    const auth = useAuthStore();

    const memberId = auth.isAdmin
      ? String(payload.memberId || '').trim().toUpperCase()
      : auth.loggedInMemberId;

    if (!memberId) return ui.showToast('Vui lòng chọn thành viên.', 'error');
    if (!payload.selectedRegId || !payload.shiftDate) {
      return ui.showToast('Vui lòng chọn ca đã đăng ký để xin nghỉ.', 'error');
    }
    const reason = sanitizeText(payload.reason, 500);
    if (!reason) return ui.showToast('Vui lòng nhập lý do xin nghỉ phép.', 'error');

    const newId = `l_${Date.now()}`;
    const record = {
      id: newId,
      regId: payload.selectedRegId,
      activityId: payload.activityId || null,
      activityName: payload.activityName || '',
      isActivity: Boolean(payload.isActivity),
      memberId,
      memberName: getMemberName(memberId),
      department: payload.department || getMemberDept(memberId),
      date: payload.shiftDate, // Write both date & shiftDate for complete compatibility
      shiftDate: payload.shiftDate,
      shiftType: payload.shiftType,
      reason,
      status: 'Chờ duyệt',
      createdAt: new Date().toISOString()
    };

    const db = getDb();
    if (db) {
      await setDoc(doc(db, 'leave_requests', newId), record);
    } else {
      leaveRequests.value.unshift(record);
    }
    ui.showToast('Đã nộp đơn xin nghỉ phép, đang chờ Quản trị viên duyệt.', 'success');
    return true;
  }

  async function submitActivityLeave(activity, { reason, selectedShiftIds = [], selectedShifts = [] }) {
    const ui = useUiStore();
    const auth = useAuthStore();
    const memberId = auth.loggedInMemberId;
    if (!memberId || !activity) return false;

    const cleanReason = sanitizeText(reason, 500);
    if (!cleanReason) {
      ui.showToast('Vui lòng nhập lý do xin nghỉ.', 'error');
      return false;
    }

    const memberName = getMemberName(memberId);
    const memberDept = getMemberDept(memberId);
    const db = getDb();

    // 1. Upsert activity_checkins with status='leave'
    const existingChk = activityCheckIns.value.find(
      (c) => c.activityId === activity.id && c.memberId === memberId
    );
    const chkId = existingChk?.id || `chk_${Date.now()}`;
    const chkRecord = {
      ...(existingChk || {}),
      id: chkId,
      activityId: activity.id,
      memberId,
      memberName,
      timestamp: new Date().toISOString(),
      status: 'leave',
      leaveReason: cleanReason,
      leaveShifts: selectedShifts,
      leaveApproved: false
    };

    // 2. Upsert leave_requests so Admin sees & approves it in Leave tab
    let shiftDesc = `Hoạt động: ${activity.name}`;
    if (selectedShifts.length > 0) {
      shiftDesc = `Hoạt động: ${activity.name} (${selectedShifts.map((s) => `${s.shiftType} ngày ${formatDate(s.date)}`).join(', ')})`;
    }
    const effectiveDate = (selectedShifts[0]?.date || activity.date || getTodayStr());
    const leaveId = `l_act_${activity.id}_${memberId}`;
    const leaveRecord = {
      id: leaveId,
      regId: `act_${activity.id}_${memberId}`,
      activityId: activity.id,
      activityName: activity.name,
      isActivity: true,
      selectedShiftIds,
      selectedShifts,
      memberId,
      memberName,
      department: memberDept,
      date: effectiveDate,
      shiftDate: effectiveDate,
      shiftType: shiftDesc,
      reason: cleanReason,
      status: 'Chờ duyệt',
      createdAt: new Date().toISOString()
    };

    if (db) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'activity_checkins', chkId), chkRecord, { merge: true });
      batch.set(doc(db, 'leave_requests', leaveId), leaveRecord, { merge: true });
      await batch.commit();
    } else {
      activityCheckIns.value.unshift(chkRecord);
      leaveRequests.value.unshift(leaveRecord);
    }

    ui.showToast('Đã gửi đơn xin nghỉ hoạt động.', 'success');
    return true;
  }

  async function updateLeaveStatus(leaveItem, newStatus) {
    const ui = useUiStore();
    const auth = useAuthStore();
    if (!auth.isAdmin) return ui.showToast('Chỉ Quản trị viên có quyền duyệt đơn.', 'error');

    const db = getDb();
    const updated = {
      ...leaveItem,
      status: newStatus,
      reviewedAt: new Date().toISOString(),
      reviewedBy: auth.loggedInMemberId
    };

    if (db) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'leave_requests', leaveItem.id), updated, { merge: true });

      const targetRegId = leaveItem.regId || leaveItem.selectedRegId;
      if (newStatus === 'Đã duyệt' && !leaveItem.isActivity && targetRegId) {
        batch.delete(doc(db, 'registrations', targetRegId));
      }

      if (leaveItem.isActivity || leaveItem.activityId) {
        const chk = activityCheckIns.value.find(
          (c) => c.activityId === leaveItem.activityId && c.memberId === leaveItem.memberId
        );
        if (chk) {
          if (newStatus === 'Đã duyệt') {
            batch.set(doc(db, 'activity_checkins', chk.id), { status: 'leave', leaveApproved: true }, { merge: true });
          } else if (newStatus === 'Từ chối') {
            batch.delete(doc(db, 'activity_checkins', chk.id));
          }
        }
        if (newStatus === 'Đã duyệt') {
          if (Array.isArray(leaveItem.selectedShiftIds) && leaveItem.selectedShiftIds.length > 0) {
            for (const rId of leaveItem.selectedShiftIds) {
              batch.delete(doc(db, 'activity_registrations', rId));
            }
          } else if (targetRegId && !String(targetRegId).startsWith('act_')) {
            batch.delete(doc(db, 'activity_registrations', targetRegId));
          }
        }
      }

      await batch.commit();
    }

    ui.showToast(`Đã cập nhật trạng thái đơn: ${newStatus}.`, 'success');
    return true;
  }

  // =========================================================================
  // ACTIVITIES, SEMESTERS, CHECK-INS & PROOFS
  // =========================================================================
  function computeActivityDerivedFields(act) {
    if (!act) return {};
    const codeId = Number(act.codeId || act.code || 1);
    const startDate = act.date || act.startDate || getTodayStr();
    const endDate = act.endDate || startDate;
    const deadlineDate = act.deadlineDate || addDays(endDate, 3);
    const location = act.location || 'Trường ĐH';
    const submitDate = act.submitDate || '';
    const today = getTodayStr();

    let progressStatus = 'Chưa gửi';
    let conclusionStatus = 'Chưa có';

    if (submitDate) {
      progressStatus = 'Đã xử lý';
      if (submitDate < deadlineDate) conclusionStatus = 'Gửi sớm hạn';
      else if (submitDate === deadlineDate) conclusionStatus = 'Gửi đúng hạn';
      else conclusionStatus = 'Gửi trễ hạn';
    } else if (today > deadlineDate) {
      progressStatus = 'Đã quá hạn';
    }

    return {
      codeId,
      startDate,
      endDate,
      deadlineDate,
      location,
      contentVN: `Tham gia ${act.name} tại ${location}, ngày ${formatDate(endDate)}`,
      contentEN: `Participating in ${act.name} at ${location}, on ${formatDate(endDate)}`,
      submitDate,
      progressStatus,
      conclusionStatus,
      excelFileName: `${codeId}-${endDate.replace(/-/g, '')} DSSV ${act.name}.xlsx`
    };
  }

  function getActivityStats(activityId) {
    const checkIns = activityCheckIns.value.filter((c) => c.activityId === activityId);
    const presentList = checkIns.filter((c) => c.status === 'present');
    const leaveList = checkIns.filter((c) => c.status === 'leave');
    const regsList = activityRegistrations.value.filter((r) => r.activityId === activityId);
    return {
      totalCheckIns: presentList.length,
      totalLeaves: leaveList.length,
      totalRegistrations: regsList.length,
      presentList,
      leaveList,
      regsList,
      allRecords: checkIns
    };
  }

  function getUserCheckInRecord(activityId, memberId) {
    if (!memberId) return null;
    const key = String(memberId).trim().toUpperCase();
    return activityCheckIns.value.find((c) => c.activityId === activityId && c.memberId === key) || null;
  }

  const adminActivitySummaryStats = computed(() => {
    const today = getTodayStr();
    let submittedOnTimeCount = 0;
    let overdueCount = 0;
    for (const act of activities.value) {
      const d = computeActivityDerivedFields(act);
      if (act.submittedTrainingPoints || (d.submitDate && d.submitDate <= d.deadlineDate)) {
        submittedOnTimeCount += 1;
      } else if ((d.submitDate && d.submitDate > d.deadlineDate) || (!d.submitDate && today > d.deadlineDate)) {
        overdueCount += 1;
      }
    }
    return {
      totalExecuted: activities.value.length,
      submittedOnTimeCount,
      overdueCount
    };
  });

  async function addSemester(semName) {
    const ui = useUiStore();
    const clean = sanitizeText(semName, 80);
    if (!clean) return ui.showToast('Vui lòng nhập tên học kỳ.', 'error');
    if (semesters.value.includes(clean)) return ui.showToast('Học kỳ này đã tồn tại.', 'warning');
    const next = [...semesters.value, clean];
    semesters.value = next;
    const db = getDb();
    if (db) await setDoc(doc(db, 'app_config', 'semesters'), { list: next });
    ui.showToast(`Đã thêm học kỳ "${clean}".`, 'success');
  }

  async function deleteSemester(semName) {
    const ui = useUiStore();
    const next = semesters.value.filter((s) => s !== semName);
    semesters.value = next;
    const db = getDb();
    if (db) await setDoc(doc(db, 'app_config', 'semesters'), { list: next });
    ui.showToast(`Đã xóa học kỳ "${semName}".`, 'success');
  }

  async function createActivity(formData) {
    const ui = useUiStore();
    const name = sanitizeText(formData.name, 200);
    const endDate = formData.endDate || formData.date;
    const semester = sanitizeText(formData.semester, 80);
    if (!name) return ui.showToast('Vui lòng nhập tên hoạt động.', 'error');
    if (!endDate) return ui.showToast('Vui lòng chọn ngày kết thúc.', 'error');
    if (!semester) return ui.showToast('Vui lòng chọn học kỳ.', 'error');

    const startDate = formData.date || endDate;
    const maxCode = activities.value.reduce((m, a) => Math.max(m, Number(a.codeId || a.code || 0)), 0);
    const codeId = maxCode + 1;
    const submitDate = formData.submitDate ? formData.submitDate.trim() : '';

    const newAct = {
      id: `act_${Date.now()}`,
      codeId,
      code: codeId,
      name,
      date: startDate,
      endDate,
      deadlineDate: addDays(endDate, 3),
      submitDate,
      semester,
      location: sanitizeText(formData.location || 'Trường ĐH', 160),
      description: sanitizeText(formData.description || '', 500),
      submittedTrainingPoints: Boolean(submitDate),
      createdAt: new Date().toISOString()
    };

    const db = getDb();
    if (db) {
      await setDoc(doc(db, 'activities', newAct.id), newAct);
    } else {
      activities.value.unshift(newAct);
    }
    ui.showToast(`Đã tạo hoạt động #${codeId} "${name}".`, 'success');
    return true;
  }

  async function updateActivitySubmitDate(actId, newSubmitDate) {
    const ui = useUiStore();
    const act = activities.value.find((a) => a.id === actId);
    if (!act) return;
    const updated = {
      submitDate: newSubmitDate || '',
      submittedTrainingPoints: Boolean(newSubmitDate)
    };
    const db = getDb();
    if (db) {
      await setDoc(doc(db, 'activities', actId), updated, { merge: true });
    }
    ui.showToast('Đã cập nhật ngày gửi hồ sơ.', 'success');
  }

  async function deleteActivity(actId) {
    const ui = useUiStore();
    const act = activities.value.find((a) => a.id === actId);
    const db = getDb();
    if (db) {
      const chks = activityCheckIns.value.filter((c) => c.activityId === actId);
      const regs = activityRegistrations.value.filter((r) => r.activityId === actId);
      const batch = writeBatch(db);
      batch.delete(doc(db, 'activities', actId));
      chks.forEach((c) => {
        batch.delete(doc(db, 'activity_checkins', c.id));
        batch.delete(doc(db, 'activity_proofs', c.id));
      });
      regs.forEach((r) => batch.delete(doc(db, 'activity_registrations', r.id)));
      await batch.commit();
    }
    ui.showToast(`Đã xóa hoạt động "${act?.name || actId}".`, 'success');
  }

  async function registerActivityShift({ activityId, date, shiftType, notes }) {
    const ui = useUiStore();
    const auth = useAuthStore();
    const memberId = auth.loggedInMemberId;
    if (!memberId) return ui.showToast('Bạn chưa đăng nhập.', 'error');

    const dup = activityRegistrations.value.some(
      (r) => r.activityId === activityId && r.memberId === memberId && r.date === date && r.shiftType === shiftType
    );
    if (dup) return ui.showToast('Bạn đã đăng ký ca này rồi.', 'warning');

    const newReg = {
      id: `actreg_${Date.now()}`,
      activityId,
      memberId,
      memberName: getMemberName(memberId),
      date,
      shiftType,
      notes: sanitizeText(notes || '', 250),
      createdAt: new Date().toISOString()
    };

    const db = getDb();
    if (db) {
      await setDoc(doc(db, 'activity_registrations', newReg.id), newReg);
    } else {
      activityRegistrations.value.push(newReg);
    }
    ui.showToast(`Đăng ký thành công ${shiftType} ngày ${formatDate(date)}.`, 'success');
    return true;
  }

  async function deleteActivityRegistration(regId) {
    const ui = useUiStore();
    const db = getDb();
    if (db) {
      await deleteDoc(doc(db, 'activity_registrations', regId));
    }
    activityRegistrations.value = activityRegistrations.value.filter((r) => r.id !== regId);
    ui.showToast('Đã hủy đăng ký ca hoạt động.', 'info');
  }

  async function uploadProofToGoogleDrive(base64Data, fileName, folderDateName, actName) {
    if (!base64Data) return;
    const gasUrl = localStorage.getItem('google_drive_script_url') || DEFAULT_GAS_URL;
    if (!gasUrl) return;
    try {
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          base64: cleanBase64,
          fileName: fileName || 'photo.jpg',
          folderName: folderDateName || 'HoatDong',
          folderId: '1zbUHwDzxXVfYK_kTIdQvVZXYJ2sVMBsd',
          mimeType: 'image/jpeg',
          actName: actName || ''
        })
      });
    } catch (err) {
      console.warn('[Drive Backup]', err);
    }
  }

  async function checkInActivity({
    activityId,
    targetMemberId = null,
    proofImage = null,
    proofFileName = '',
    proofFolderDate = '',
    shiftInfo = null
  }) {
    const ui = useUiStore();
    const auth = useAuthStore();
    const isAdminOp = Boolean(targetMemberId) || auth.isAdmin;
    const memberId = String(targetMemberId || auth.loggedInMemberId || '').trim().toUpperCase();

    if (!memberId) return ui.showToast('Chưa xác định MSSV thành viên.', 'error');
    const act = activities.value.find((a) => a.id === activityId);
    if (!act) return ui.showToast('Không tìm thấy hoạt động.', 'error');

    const today = getTodayStr();
    if (!isAdminOp) {
      const validDates = getDateRange(act.date, act.endDate || act.date);
      if (!validDates.includes(today)) {
        return ui.showToast(
          act.date > today
            ? `Chưa đến ngày diễn ra (${formatDate(act.date)}).`
            : `Hoạt động đã quá hạn, vui lòng liên hệ Quản trị viên để điểm danh bù.`,
          'warning'
        );
      }
    }

    const memberName = getMemberName(memberId);
    const existing = activityCheckIns.value.find(
      (c) => c.activityId === activityId && c.memberId === memberId
    );

    if (existing && existing.status === 'present' && !isAdminOp) {
      return ui.showToast('Bạn đã điểm danh hoạt động này rồi.', 'warning');
    }

    const nowIso = new Date().toISOString();
    const chkId = existing?.id || `chk_${Date.now()}`;
    const hasProof = Boolean(proofImage || existing?.hasProof || existing?.proofImage);

    // Store light metadata in activity_checkins; store compressed image in activity_proofs/{chkId}
    const chkRecord = {
      id: chkId,
      activityId,
      memberId,
      memberName,
      shiftType: shiftInfo?.shiftType || existing?.shiftType || '',
      shiftDate: shiftInfo?.date || existing?.shiftDate || '',
      timestamp: nowIso,
      formattedTime: formatCheckInTime(nowIso),
      status: 'present',
      leaveReason: '',
      hasProof,
      proofFileName: proofFileName || existing?.proofFileName || '',
      proofFolderDate: proofFolderDate || existing?.proofFolderDate || '',
      adminCheckedIn: isAdminOp
    };

    const db = getDb();
    if (db) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'activity_checkins', chkId), chkRecord, { merge: true });
      if (proofImage) {
        batch.set(doc(db, 'activity_proofs', chkId), {
          id: chkId,
          activityId,
          memberId,
          proofImage,
          proofFileName: proofFileName || '',
          createdAt: nowIso
        });
        proofCache.set(chkId, proofImage);
      }
      await batch.commit();
    }

    if (proofImage) {
      uploadProofToGoogleDrive(proofImage, proofFileName, proofFolderDate, act.name);
    }

    ui.showToast(
      isAdminOp
        ? `Đã điểm danh hộ cho ${memberName} (${memberId}).`
        : `Điểm danh hoạt động thành công (${memberName}).`,
      'success'
    );
    return true;
  }

  // =========================================================================
  // MEMBERS & DEPARTMENTS (with writeBatch)
  // =========================================================================
  async function addDepartment(deptName) {
    const ui = useUiStore();
    const clean = sanitizeText(deptName, 80);
    if (!clean) return ui.showToast('Vui lòng nhập tên Ban.', 'error');
    if (departments.value.includes(clean)) return ui.showToast('Ban này đã tồn tại.', 'warning');
    const next = [...departments.value, clean];
    departments.value = next;
    const db = getDb();
    if (db) await setDoc(doc(db, 'app_config', 'departments'), { list: next });
    ui.showToast(`Đã thêm Ban "${clean}".`, 'success');
  }

  async function saveMember(formPayload) {
    const ui = useUiStore();
    const auth = useAuthStore();
    if (!auth.isAdmin) return ui.showToast('Chỉ Quản trị viên có quyền quản lý thành viên.', 'error');

    const mId = sanitizeText(formPayload.id, 16).toUpperCase();
    const name = sanitizeText(formPayload.name, 120);
    if (!mId || !name) return ui.showToast('Vui lòng nhập đầy đủ MSSV và Họ tên.', 'error');

    const record = {
      id: mId,
      name,
      department: sanitizeText(formPayload.department || 'Ban Hành chính', 80),
      dob: formPayload.dob || '',
      role: formPayload.role === 'admin' ? 'admin' : 'member',
      targetShifts: Math.max(1, Number(formPayload.targetShifts) || 10)
    };

    const db = getDb();
    if (db) {
      await setDoc(doc(db, 'members', mId), record, { merge: true });
      if (record.role === 'admin') {
        if (formPayload.newAdminPassword?.trim()) {
          await auth.setMemberAdminCredential(mId, name, record.department, formPayload.newAdminPassword.trim());
        }
      } else {
        await auth.revokeMemberAdminCredential(mId);
      }
    }
    ui.showToast(`Đã lưu thông tin thành viên ${name} (${mId}).`, 'success');
    return true;
  }

  async function deleteMember(memberObj) {
    const ui = useUiStore();
    const auth = useAuthStore();
    if (!auth.isAdmin || !memberObj) return;
    const db = getDb();
    if (db) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'members', memberObj.docId || memberObj.id));
      batch.delete(doc(db, 'admin_accounts', memberObj.id));
      await batch.commit();
    }
    ui.showToast(`Đã xóa thành viên ${memberObj.name} (${memberObj.id}).`, 'success');
  }

  async function saveBatchMembers(rawText) {
    const ui = useUiStore();
    const auth = useAuthStore();
    if (!auth.isAdmin) return ui.showToast('Chỉ Quản trị viên có quyền nhập hàng loạt.', 'error');
    const lines = String(rawText || '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return ui.showToast('Vui lòng dán danh sách thành viên.', 'error');

    const db = getDb();
    const parsed = [];
    for (const line of lines) {
      const parts = line.split(/[\t,;|]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const mId = sanitizeText(parts[0], 16).toUpperCase();
        const mName = sanitizeText(parts[1], 120);
        const mDept = sanitizeText(parts[2] || 'Ban Hành chính', 80);
        if (mId && mName) {
          parsed.push({ id: mId, name: mName, department: mDept, role: 'member', targetShifts: 10 });
        }
      }
    }

    if (!parsed.length) {
      return ui.showToast('Không tìm thấy dòng hợp lệ (MSSV, Họ tên, Ban).', 'error');
    }

    if (db) {
      // Firestore batch limit is 500 writes per batch
      for (let i = 0; i < parsed.length; i += 400) {
        const chunk = parsed.slice(i, i + 400);
        const batch = writeBatch(db);
        for (const m of chunk) {
          batch.set(doc(db, 'members', m.id), m, { merge: true });
        }
        await batch.commit();
      }
    }

    ui.showToast(`Đã nhập ${parsed.length} thành viên lên hệ thống.`, 'success');
    return true;
  }

  // Computed helpers scoped to global selectedMonth & selectedWeek
  function getShiftsForPeriod(selectedMonth, selectedWeek, role = 'admin', memberId = '') {
    return shifts.value.filter((s) => {
      if (role === 'member' && memberId && s.memberId !== memberId.toUpperCase()) return false;
      if (selectedMonth && !isDateInSelectedMonth(s.date, selectedMonth)) return false;
      if (selectedWeek && selectedWeek !== 'all' && !isDateInSelectedWeek(s.date, selectedWeek)) return false;
      return true;
    });
  }

  function getRegistrationsForPeriod(selectedMonth, selectedWeek) {
    return registrations.value.filter((r) => {
      if (selectedMonth && !isDateInSelectedMonth(r.date, selectedMonth)) return false;
      if (selectedWeek && selectedWeek !== 'all' && !isDateInSelectedWeek(r.date, selectedWeek)) return false;
      return true;
    });
  }

  return {
    // State
    members,
    shifts,
    registrations,
    leaveRequests,
    activities,
    activityCheckIns,
    activityRegistrations,
    semesters,
    departments,
    shiftSettings,
    isCloudConnected,
    // Derived
    memberMap,
    shiftTypes,
    shiftTypeNames,
    adminActivitySummaryStats,
    // Lookups
    findMember,
    getMemberName,
    getMemberDept,
    getShiftRegisteredCount,
    isShiftFullOnDate,
    getTakenShiftsCountForDate,
    isDateFull,
    computeActivityDerivedFields,
    getActivityStats,
    getUserCheckInRecord,
    getShiftsForPeriod,
    getRegistrationsForPeriod,
    // Lifecycle
    initCloud,
    teardownListeners,
    fetchArchiveMonth,
    fetchProofImage,
    // Mutations
    saveShift,
    saveRegistration,
    deleteRegistration,
    saveShiftSettings,
    toggleRegistrationOpen,
    saveLeaveRequest,
    submitActivityLeave,
    updateLeaveStatus,
    addSemester,
    deleteSemester,
    createActivity,
    updateActivitySubmitDate,
    deleteActivity,
    registerActivityShift,
    deleteActivityRegistration,
    checkInActivity,
    addDepartment,
    saveMember,
    deleteMember,
    saveBatchMembers
  };
});
