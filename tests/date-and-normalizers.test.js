import { describe, it, expect } from 'vitest';
import { getWeekNumFromDate, isDateInSelectedWeek, formatDate, addDays, getDateRange } from '../src/utils/date.js';
import { normalizeMember, normalizeLeaveRequest, normalizeCheckIn } from '../src/utils/normalizers.js';

describe('date & week utilities', () => {
  it('uses unified 4-week month segmentation', () => {
    expect(getWeekNumFromDate('2026-11-01')).toBe(1);
    expect(getWeekNumFromDate('2026-11-08')).toBe(1);
    expect(getWeekNumFromDate('2026-11-09')).toBe(2);
    expect(getWeekNumFromDate('2026-11-18')).toBe(2);
    expect(getWeekNumFromDate('2026-11-19')).toBe(3);
    expect(getWeekNumFromDate('2026-11-25')).toBe(3);
    expect(getWeekNumFromDate('2026-11-26')).toBe(4);
    expect(getWeekNumFromDate('2026-11-30')).toBe(4);

    expect(isDateInSelectedWeek('2026-11-15', '2')).toBe(true);
    expect(isDateInSelectedWeek('2026-11-15', '1')).toBe(false);
    expect(isDateInSelectedWeek('2026-11-15', 'all')).toBe(true);
  });

  it('formats dates and generates ranges accurately', () => {
    expect(formatDate('2026-11-27')).toBe('27/11/2026');
    expect(addDays('2026-11-28', 3)).toBe('2026-12-01');
    expect(getDateRange('2026-11-29', '2026-12-01')).toEqual([
      '2026-11-29',
      '2026-11-30',
      '2026-12-01'
    ]);
  });
});

describe('legacy Firestore normalizers (zero data loss)', () => {
  it('normalizes legacy member field names and strips plaintext password', () => {
    const norm = normalizeMember({
      mssv: 'c2300023',
      hoTen: 'Nguyễn Văn A',
      department: 'Ban Điều hành',
      role: 'admin',
      password: 'should-be-stripped',
      customLegacyField: 'keep-me'
    }, 'doc-1');

    expect(norm.id).toBe('C2300023');
    expect(norm.name).toBe('Nguyễn Văn A');
    expect(norm.password).toBeUndefined();
    expect(norm.customLegacyField).toBe('keep-me');
  });

  it('unifies date and shiftDate on leave requests', () => {
    const fromShiftDate = normalizeLeaveRequest({ memberId: 'c2300023', shiftDate: '2026-11-20', reason: 'Thi' }, 'l1');
    expect(fromShiftDate.date).toBe('2026-11-20');
    expect(fromShiftDate.shiftDate).toBe('2026-11-20');

    const fromLegacyDate = normalizeLeaveRequest({ memberId: 'c2300023', date: '2026-10-05', reason: 'Bận' }, 'l2');
    expect(fromLegacyDate.date).toBe('2026-10-05');
    expect(fromLegacyDate.shiftDate).toBe('2026-10-05');
  });

  it('preserves legacy inline proofImage while marking hasProof', () => {
    const legacy = normalizeCheckIn({ activityId: 'a1', memberId: 'c2300023', proofImage: 'data:image/jpeg;base64,abc' }, 'chk1');
    expect(legacy.hasProof).toBe(true);
    expect(legacy.proofImage).toBe('data:image/jpeg;base64,abc');
  });
});
