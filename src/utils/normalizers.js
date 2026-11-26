// Backward-compatible Firestore document normalizers (preserves all legacy data without loss)

export const DEFAULT_SHIFT_TYPES = [
  { id: 'Ca 1', name: 'Ca 1', time: '7h30 - 9h20' },
  { id: 'Ca 2', name: 'Ca 2', time: '9h20 - 11h30' },
  { id: 'Ca 3', name: 'Ca 3', time: '13h00 - 15h20' },
  { id: 'Ca 4', name: 'Ca 4', time: '15h20 - 17h00' }
];

export const DEFAULT_SHIFT_SETTINGS = {
  isRegistrationOpen: true,
  maxPerShift: 0,
  maxPerDay: 0,
  shiftTypes: DEFAULT_SHIFT_TYPES
};

const NAME_KEYS = [
  'name', 'fullName', 'hoTen', 'ho_ten', 'full_name', 'ten',
  'Name', 'HoTen', 'FullName', 'HoVaTen', 'ho_va_ten',
  'tenSV', 'ten_sv', 'TenSV', 'StudentName', 'student_name',
  'user_name', 'display_name', 'label'
];

const EXCLUDE_NAME_KEYS = new Set([
  'id', 'mssv', 'maSV', 'studentId', 'code', 'memberId', 'role',
  'department', 'dob', 'createdAt', 'targetShifts', 'password', 'docId',
  'passwordHash', 'passwordSalt'
]);

export function extractMemberName(raw, canonicalId) {
  if (!raw || typeof raw !== 'object') return canonicalId;

  for (const key of NAME_KEYS) {
    const val = raw[key];
    if (typeof val === 'string' && val.trim()) {
      const trimmed = val.trim();
      if (trimmed.toUpperCase() !== canonicalId && !trimmed.startsWith('Thành viên [')) {
        return trimmed;
      }
    }
  }

  for (const key of Object.keys(raw)) {
    if (EXCLUDE_NAME_KEYS.has(key)) continue;
    const val = raw[key];
    if (typeof val === 'string' && val.trim()) {
      const trimmed = val.trim();
      if (trimmed.toUpperCase() !== canonicalId && !trimmed.startsWith('Thành viên [')) {
        return trimmed;
      }
    }
  }

  return canonicalId;
}

export function isMemberAdminRole(member) {
  if (!member) return false;
  if (member.role === 'admin') return true;
  const dept = String(member.department || '').toLowerCase();
  return dept === 'ban điều hành' || dept.includes('điều hành') || dept.includes('bđh');
}

export function normalizeMember(raw, docId = '') {
  if (!raw || typeof raw !== 'object') return null;
  const rawId = raw.id || raw.mssv || raw.maSV || raw.studentId || raw.code || raw.memberId || docId;
  const canonicalId = String(rawId || '').trim().toUpperCase();
  if (!canonicalId) return null;

  const name = extractMemberName(raw, canonicalId);
  // Strip any accidental plaintext password from in-memory member list
  const { password: _ignoredPwd, ...safeRaw } = raw;

  return {
    ...safeRaw,
    id: canonicalId,
    docId: docId || raw.docId || canonicalId,
    name,
    department: raw.department || '',
    dob: raw.dob || '',
    role: raw.role === 'admin' ? 'admin' : 'member',
    targetShifts: Number(raw.targetShifts) > 0 ? Number(raw.targetShifts) : 10
  };
}

export function normalizeShift(raw, docId = '') {
  if (!raw || typeof raw !== 'object') return null;
  return {
    ...raw,
    id: raw.id || docId || `s_${raw.date}_${raw.shiftType}_${raw.memberId}`,
    memberId: String(raw.memberId || '').trim().toUpperCase(),
    date: raw.date || '',
    shiftType: raw.shiftType || 'Ca 1',
    pageNo: raw.pageNo ?? '',
    sttNo: raw.sttNo ?? '',
    status: raw.status || 'Đúng giờ',
    notes: raw.notes || '',
    createdAt: raw.createdAt || ''
  };
}

export function normalizeRegistration(raw, docId = '') {
  if (!raw || typeof raw !== 'object') return null;
  return {
    ...raw,
    id: raw.id || docId || `r_${raw.date}_${raw.shiftType}_${raw.memberId}`,
    memberId: String(raw.memberId || '').trim().toUpperCase(),
    date: raw.date || '',
    shiftType: raw.shiftType || 'Ca 1',
    notes: raw.notes || '',
    createdAt: raw.createdAt || ''
  };
}

export function normalizeLeaveRequest(raw, docId = '') {
  if (!raw || typeof raw !== 'object') return null;
  const effectiveDate = raw.shiftDate || raw.date || '';
  return {
    ...raw,
    id: raw.id || docId,
    memberId: String(raw.memberId || '').trim().toUpperCase(),
    date: effectiveDate,
    shiftDate: effectiveDate,
    shiftType: raw.shiftType || '',
    reason: raw.reason || '',
    status: raw.status || 'Chờ duyệt',
    isActivity: Boolean(raw.isActivity || raw.activityId),
    createdAt: raw.createdAt || ''
  };
}

export function normalizeActivity(raw, docId = '') {
  if (!raw || typeof raw !== 'object') return null;
  const startDate = raw.date || raw.startDate || '';
  return {
    ...raw,
    id: raw.id || docId,
    codeId: Number(raw.codeId || raw.code || 1),
    code: Number(raw.codeId || raw.code || 1),
    name: raw.name || '',
    date: startDate,
    endDate: raw.endDate || startDate,
    deadlineDate: raw.deadlineDate || '',
    submitDate: raw.submitDate || '',
    semester: raw.semester || '',
    location: raw.location || 'Trường ĐH',
    description: raw.description || '',
    submittedTrainingPoints: Boolean(raw.submittedTrainingPoints || raw.submitDate)
  };
}

export function normalizeCheckIn(raw, docId = '') {
  if (!raw || typeof raw !== 'object') return null;
  return {
    ...raw,
    id: raw.id || docId,
    activityId: raw.activityId || '',
    memberId: String(raw.memberId || '').trim().toUpperCase(),
    memberName: raw.memberName || '',
    status: raw.status || 'present',
    hasProof: Boolean(raw.hasProof || raw.proofImage),
    proofImage: raw.proofImage || '',
    timestamp: raw.timestamp || ''
  };
}

export function normalizeActivityRegistration(raw, docId = '') {
  if (!raw || typeof raw !== 'object') return null;
  return {
    ...raw,
    id: raw.id || docId,
    activityId: raw.activityId || '',
    memberId: String(raw.memberId || '').trim().toUpperCase(),
    memberName: raw.memberName || '',
    date: raw.date || '',
    shiftType: raw.shiftType || 'Ca 1',
    notes: raw.notes || '',
    createdAt: raw.createdAt || ''
  };
}

export function normalizeShiftSettings(raw) {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_SHIFT_SETTINGS));
  }
  const shiftTypes = Array.isArray(raw.shiftTypes) && raw.shiftTypes.length > 0
    ? raw.shiftTypes.map((st) => ({
        id: st.id || st.name || 'Ca 1',
        name: st.name || st.id || 'Ca 1',
        time: st.time || ''
      }))
    : DEFAULT_SHIFT_TYPES.map((st) => ({ ...st }));

  return {
    isRegistrationOpen: raw.isRegistrationOpen !== false,
    maxPerShift: typeof raw.maxPerShift === 'number' ? raw.maxPerShift : Number(raw.maxPerShift) || 0,
    maxPerDay: typeof raw.maxPerDay === 'number' ? raw.maxPerDay : Number(raw.maxPerDay) || 0,
    shiftTypes
  };
}
