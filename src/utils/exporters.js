// Lazy-loaded Excel report generators with formula-injection protection

import { sanitizeExcelCell } from '../services/security.js';
import { exportExcelWorkbook } from './fileExport.js';
import { formatDate, formatDayMonth, formatCheckInTime, getDateRange, isDateInSelectedWeek } from './date.js';

async function loadXlsx() {
  return await import('xlsx');
}

function sanitizeRow(row) {
  return row.map((cell) => sanitizeExcelCell(cell));
}

export async function exportShiftsReportExcel({ list, selectedMonth, getMemberName, getMemberDept, notify }) {
  if (!list || list.length === 0) {
    notify?.('Không có dữ liệu ca trực để xuất.', 'error');
    return false;
  }
  const XLSX = await loadXlsx();
  const rows = list.map((s, idx) => ({
    'STT Báo Cáo': idx + 1,
    'MSSV': sanitizeExcelCell(s.memberId),
    'Họ Và Tên': sanitizeExcelCell(getMemberName(s.memberId)),
    'Ban Hoạt Động': sanitizeExcelCell(getMemberDept(s.memberId)),
    'Ngày Trực': formatDate(s.date),
    'Ca Trực': sanitizeExcelCell(s.shiftType),
    'Trang Số Gốc': s.pageNo || '—',
    'STT Trang Sổ': s.sttNo || '—',
    'Trạng Thái': sanitizeExcelCell(s.status || 'Đã đăng ký'),
    'Ghi Chú': sanitizeExcelCell(s.notes || '')
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 25 }, { wch: 22 }, { wch: 14 },
    { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 14 }, { wch: 24 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoCaTruc');
  return exportExcelWorkbook(XLSX, wb, `BaoCao_CaTruc_${selectedMonth}.xlsx`, notify);
}

export async function exportShiftScheduleMatrixExcel({
  registrations,
  monthStr,
  selectedWeek,
  shiftTypeNames,
  getMemberName,
  notify
}) {
  let monthRegs = (registrations || []).filter((r) => r.date && r.date.substring(0, 7) === monthStr);
  if (selectedWeek && selectedWeek !== 'all') {
    const weekRegs = monthRegs.filter((r) => isDateInSelectedWeek(r.date, selectedWeek));
    if (weekRegs.length > 0) monthRegs = weekRegs;
  }
  if (monthRegs.length === 0 && registrations?.length > 0) {
    monthRegs = [...registrations];
  }
  if (monthRegs.length === 0) {
    notify?.('Chưa có lịch đăng ký ca trực nào để xuất Excel.', 'warning');
    return false;
  }

  const XLSX = await loadXlsx();

  const dateSet = new Set();
  monthRegs.forEach((r) => {
    if (r.date) dateSet.add(r.date);
  });
  const dateList = Array.from(dateSet).sort();

  const dynamicTypes = new Set(shiftTypeNames?.length ? shiftTypeNames : ['Ca 1', 'Ca 2', 'Ca 3', 'Ca 4']);
  monthRegs.forEach((r) => {
    if (r.shiftType) dynamicTypes.add(r.shiftType);
  });
  const matrixShiftTypes = Array.from(dynamicTypes);

  const shiftDateMap = {};
  matrixShiftTypes.forEach((st) => {
    shiftDateMap[st] = {};
    dateList.forEach((d) => {
      shiftDateMap[st][d] = [];
    });
  });

  monthRegs.forEach((r) => {
    const st = r.shiftType || matrixShiftTypes[0] || 'Ca 1';
    if (shiftDateMap[st]?.[r.date]) {
      const mId = String(r.memberId || '').trim().toUpperCase();
      shiftDateMap[st][r.date].push({
        mssv: sanitizeExcelCell(mId),
        name: sanitizeExcelCell(r.memberName || getMemberName(mId))
      });
    }
  });

  const rowsData = [];
  const row1 = ['BUỔI', 'STT'];
  dateList.forEach((d) => row1.push(formatDayMonth(d), ''));
  rowsData.push(row1);

  const row2 = ['', ''];
  dateList.forEach(() => row2.push('MSSV', 'HỌ VÀ TÊN'));
  rowsData.push(row2);

  const merges = [];
  for (let i = 0; i < dateList.length; i++) {
    const colStart = 2 + i * 2;
    merges.push({ s: { r: 0, c: colStart }, e: { r: 0, c: colStart + 1 } });
  }

  matrixShiftTypes.forEach((st) => {
    let maxCount = 0;
    dateList.forEach((d) => {
      if (shiftDateMap[st][d].length > maxCount) maxCount = shiftDateMap[st][d].length;
    });
    const rowCount = Math.max(1, maxCount);
    const startRow = rowsData.length;

    for (let idx = 0; idx < rowCount; idx++) {
      const row = [sanitizeExcelCell(st.toUpperCase()), idx + 1];
      dateList.forEach((d) => {
        const student = shiftDateMap[st][d][idx];
        row.push(student ? student.mssv : '', student ? student.name : '');
      });
      rowsData.push(row);
    }

    merges.push({ s: { r: startRow, c: 0 }, e: { r: startRow + rowCount - 1, c: 0 } });
  });

  const ws = XLSX.utils.aoa_to_sheet(rowsData);
  ws['!merges'] = merges;
  const cols = [{ wch: 10 }, { wch: 6 }];
  dateList.forEach(() => {
    cols.push({ wch: 14 }, { wch: 25 });
  });
  ws['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lịch Ca Làm');
  return exportExcelWorkbook(XLSX, wb, `Lich_Ca_Lam_${monthStr}.xlsx`, notify);
}

export async function exportActivityCheckInExcel({
  activity,
  derived,
  checkIns,
  registrations,
  getMemberName,
  getMemberDept,
  notify
}) {
  if (!activity) return false;
  const XLSX = await loadXlsx();

  const fileName = `${derived.codeId}-${(derived.endDate || '').replace(/-/g, '')} DS DIEM DANH ${activity.name}.xlsx`;
  const rowsData = [
    [
      'STT', 'MSSV', 'Họ và Tên', 'Ban Hoạt Động', 'Hoạt Động / Nội Dung',
      'Ngày Diễn Ra', 'Thời Gian Điểm Danh', 'Trạng Thái Điểm Danh', 'Minh Chứng / Ghi Chú'
    ]
  ];

  const seen = new Set();
  let stt = 1;

  (checkIns || []).forEach((p) => {
    const mssv = String(p.memberId || '').trim().toUpperCase();
    seen.add(mssv);
    const timeStr = p.formattedTime || (p.timestamp ? formatCheckInTime(p.timestamp) : '—');
    const statusStr = p.status === 'leave'
      ? 'Vắng có lý do (Xin nghỉ)'
      : (p.adminCheckedIn ? 'Admin điểm danh hộ' : 'Đã điểm danh (Có mặt)');
    const proofNote = p.leaveReason || (p.hasProof || p.proofImage ? 'Đã đính kèm ảnh thẻ SV' : '—');

    rowsData.push(sanitizeRow([
      stt++,
      mssv,
      p.memberName || getMemberName(mssv),
      getMemberDept(mssv),
      activity.name || derived.contentVN,
      formatDate(activity.date),
      timeStr,
      statusStr,
      proofNote
    ]));
  });

  (registrations || []).forEach((r) => {
    const mssv = String(r.memberId || '').trim().toUpperCase();
    if (seen.has(mssv)) return;
    seen.add(mssv);
    rowsData.push(sanitizeRow([
      stt++,
      mssv,
      r.memberName || getMemberName(mssv),
      getMemberDept(mssv),
      activity.name || derived.contentVN,
      formatDate(r.date || activity.date),
      '—',
      'Đã đăng ký ca (Chờ điểm danh)',
      r.notes || '—'
    ]));
  });

  if (rowsData.length === 1) {
    rowsData.push([1, '—', 'Chưa có sinh viên điểm danh hoặc đăng ký', '—', activity.name, formatDate(activity.date), '—', '—', '—']);
  }

  const ws = XLSX.utils.aoa_to_sheet(rowsData);
  ws['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 25 }, { wch: 20 }, { wch: 35 },
    { wch: 15 }, { wch: 22 }, { wch: 26 }, { wch: 26 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DS Điểm Danh');
  return exportExcelWorkbook(XLSX, wb, fileName, notify);
}

export async function exportActivityRegistrationMatrixExcel({
  activity,
  derived,
  registrations,
  getMemberName,
  notify
}) {
  if (!activity) return false;
  const dateSet = new Set(getDateRange(derived.startDate, derived.endDate));
  (registrations || []).forEach((r) => {
    if (r.date) dateSet.add(r.date);
  });
  const dateList = Array.from(dateSet).sort();

  if (dateList.length === 0) {
    notify?.('Hoạt động này chưa có ngày diễn ra để xuất danh sách.', 'warning');
    return false;
  }

  const XLSX = await loadXlsx();
  const dynamicTypes = new Set(['Ca 1', 'Ca 2', 'Ca 3', 'Ca 4']);
  (registrations || []).forEach((r) => {
    if (r.shiftType) dynamicTypes.add(r.shiftType);
  });
  const shiftTypes = Array.from(dynamicTypes);

  const shiftDateMap = {};
  shiftTypes.forEach((st) => {
    shiftDateMap[st] = {};
    dateList.forEach((d) => {
      shiftDateMap[st][d] = [];
    });
  });

  (registrations || []).forEach((r) => {
    const st = r.shiftType || 'Ca 1';
    if (shiftDateMap[st]?.[r.date]) {
      const mssv = String(r.memberId || '').trim().toUpperCase();
      shiftDateMap[st][r.date].push({
        mssv: sanitizeExcelCell(mssv),
        name: sanitizeExcelCell(r.memberName || getMemberName(mssv))
      });
    }
  });

  const rowsData = [];
  const row1 = ['BUỔI', 'STT'];
  dateList.forEach((d) => row1.push(formatDayMonth(d), ''));
  rowsData.push(row1);

  const row2 = ['', ''];
  dateList.forEach(() => row2.push('MSSV', 'HỌ VÀ TÊN'));
  rowsData.push(row2);

  const merges = [];
  for (let i = 0; i < dateList.length; i++) {
    const colStart = 2 + i * 2;
    merges.push({ s: { r: 0, c: colStart }, e: { r: 0, c: colStart + 1 } });
  }

  shiftTypes.forEach((st) => {
    let maxCount = 0;
    dateList.forEach((d) => {
      if (shiftDateMap[st][d].length > maxCount) maxCount = shiftDateMap[st][d].length;
    });
    const rowCount = Math.max(1, maxCount);
    const startRow = rowsData.length;

    for (let idx = 0; idx < rowCount; idx++) {
      const row = [sanitizeExcelCell(st.toUpperCase()), idx + 1];
      dateList.forEach((d) => {
        const student = shiftDateMap[st][d][idx];
        row.push(student ? student.mssv : '', student ? student.name : '');
      });
      rowsData.push(row);
    }
    merges.push({ s: { r: startRow, c: 0 }, e: { r: startRow + rowCount - 1, c: 0 } });
  });

  const ws = XLSX.utils.aoa_to_sheet(rowsData);
  ws['!merges'] = merges;
  const cols = [{ wch: 10 }, { wch: 6 }];
  dateList.forEach(() => cols.push({ wch: 14 }, { wch: 25 }));
  ws['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DS Đăng Ký Ca');
  const cleanEnd = (derived.endDate || '').replace(/-/g, '');
  return exportExcelWorkbook(XLSX, wb, `${derived.codeId}-${cleanEnd} DS DANG KY ${activity.name}.xlsx`, notify);
}
