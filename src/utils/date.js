// Unified local date & week utilities (consistent across all tabs and reports)

export function getTodayStr(baseDate = new Date()) {
  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  const dd = String(baseDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getMonthStr(baseDate = new Date()) {
  const yyyy = baseDate.getFullYear();
  const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

// First day of previous month (active 2-month Firestore window to minimize free-tier reads)
export function getActiveWindowMinDate(baseDate = new Date()) {
  const prevMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
  const y = prevMonth.getFullYear();
  const m = String(prevMonth.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parts = String(dateStr).split('-');
  if (parts.length < 3) return String(dateStr);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatDayMonth(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length < 3) return String(dateStr);
  return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}`;
}

export function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return String(isoStr);
  return d.toLocaleString('vi-VN');
}

export function formatCheckInTime(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}h${mins}, ${day}/${month}/${year}`;
}

export function addDays(dateStr, numDays) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length < 3) return String(dateStr);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + numDays);
  return getTodayStr(d);
}

export function getDateRange(startStr, endStr) {
  if (!startStr) return [];
  const end = endStr || startStr;
  const p1 = String(startStr).split('-').map(Number);
  const p2 = String(end).split('-').map(Number);
  if (p1.length < 3 || p2.length < 3) return [startStr];
  const result = [];
  const curr = new Date(p1[0], p1[1] - 1, p1[2]);
  const last = new Date(p2[0], p2[1] - 1, p2[2]);
  // Guard against malformed date ranges (> 60 days)
  let guard = 0;
  while (curr <= last && guard < 62) {
    result.push(getTodayStr(curr));
    curr.setDate(curr.getDate() + 1);
    guard += 1;
  }
  return result;
}

// Standard DVP 4-week month segmentation (used consistently in Filters, History & Dashboard)
export const REPORTING_WEEKS = [
  { id: '1', label: 'Tuần 1', range: '1–8', fullLabel: 'Tuần 1 (Ngày 1 - 8)' },
  { id: '2', label: 'Tuần 2', range: '9–18', fullLabel: 'Tuần 2 (Ngày 9 - 18)' },
  { id: '3', label: 'Tuần 3', range: '19–25', fullLabel: 'Tuần 3 (Ngày 19 - 25)' },
  { id: '4', label: 'Tuần 4', range: '26–Cuối', fullLabel: 'Tuần 4 (Ngày 26 - Cuối tháng)' }
];

export function getWeekNumFromDate(dateStr) {
  if (!dateStr) return 1;
  const parts = String(dateStr).split('-');
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(day) || day <= 8) return 1;
  if (day <= 18) return 2;
  if (day <= 25) return 3;
  return 4;
}

export function getWeekNameFromDate(dateStr) {
  const num = getWeekNumFromDate(dateStr);
  return REPORTING_WEEKS[num - 1]?.fullLabel || 'Tuần 1 (Ngày 1 - 8)';
}

export function isDateInSelectedWeek(dateStr, selectedWeek) {
  if (!dateStr) return false;
  if (!selectedWeek || selectedWeek === 'all') return true;
  return String(getWeekNumFromDate(dateStr)) === String(selectedWeek);
}

export function isDateInSelectedMonth(dateStr, selectedMonth) {
  if (!dateStr || !selectedMonth) return true;
  return String(dateStr).substring(0, 7) === selectedMonth;
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  return (parts[parts.length - 1] || '?').charAt(0).toUpperCase();
}
