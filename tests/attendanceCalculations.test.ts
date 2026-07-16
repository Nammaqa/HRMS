import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAttendanceStats } from '../lib/attendanceCalculations';

test('calculates present, leave, wfh, and absent days from explicit dates', () => {
  const holidayDates = new Set(['2026-07-06']);

  const stats = calculateAttendanceStats(
    {
      id: 1,
      dateOfJoining: new Date('2026-07-01T00:00:00.000Z'),
      dateOfExit: new Date('2026-07-08T00:00:00.000Z'),
    },
    [
      { date: new Date('2026-07-01T00:00:00.000Z'), status: 'FULL_DAY' },
      { date: new Date('2026-07-03T00:00:00.000Z'), status: 'FULL_DAY' },
      { date: new Date('2026-07-08T00:00:00.000Z'), status: 'FULL_DAY' },
    ],
    [{ startDate: new Date('2026-07-04T00:00:00.000Z'), endDate: new Date('2026-07-04T00:00:00.000Z') }],
    [{ date: new Date('2026-07-07T00:00:00.000Z') }],
    holidayDates
  );

  assert.equal(stats.presentDays, 3);
  assert.equal(stats.leaveDays, 1);
  assert.equal(stats.wfhDays, 1);
  assert.equal(stats.absentDays, 1);
  assert.deepEqual(stats.absentDates, ['2026-07-02']);
});
