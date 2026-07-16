/**
 * Shared attendance calculation utility
 * Used by both employee dashboard and admin employee summary endpoints
 * Ensures consistent calculations across the application
 */

export interface AttendanceRecord {
  date: Date;
  status: string;
}

export interface LeaveRequest {
  startDate: Date;
  endDate: Date;
}

export interface WFHRequest {
  date: Date;
}

export interface UserData {
  id: number;
  dateOfJoining?: Date | null;
  dateOfExit?: Date | null;
}

export interface AttendanceStats {
  presentDays: number;
  absentDays: number;
  leavesDays: number;
  workFromHomeDays: number;
}

/**
 * Convert a date to ISO string format (YYYY-MM-DD)
 */
export function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Normalize a date to midnight UTC
 */
export function normalizeDateOnly(date: Date): Date {
  const normalized = new Date(date.toISOString().split("T")[0]);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Count working days (excluding weekends and holidays) in a date range
 */
export function countWorkingDays(
  start: Date,
  end: Date,
  holidayDates: Set<string>
): number {
  let count = 0;
  let current = normalizeDateOnly(start);
  const last = normalizeDateOnly(end);

  if (current > last) {
    return 0;
  }

  while (current <= last) {
    const dayOfWeek = current.getUTCDay();
    const dateKey = getDateKey(current);

    // Exclude Saturdays, Sundays, and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateKey)) {
      count += 1;
    }

    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }

  return count;
}

/**
 * Collect all working days in a date range as a Set of date keys
 */
export function collectWorkingDaysInRange(
  start: Date,
  end: Date,
  holidayDates: Set<string>
): Set<string> {
  const days = new Set<string>();
  let current = normalizeDateOnly(start);
  const last = normalizeDateOnly(end);

  if (current > last) {
    return days;
  }

  while (current <= last) {
    const dayOfWeek = current.getUTCDay();
    const dateKey = getDateKey(current);

    // Exclude Saturdays, Sundays, and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateKey)) {
      days.add(dateKey);
    }

    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }

  return days;
}

/**
 * Calculate attendance statistics for a single employee
 * This is the core calculation logic used by both dashboard and admin endpoints
 */
export function calculateAttendanceStats(
  user: UserData,
  attendanceRecords: AttendanceRecord[],
  leaveRequests: LeaveRequest[],
  wfhRequests: WFHRequest[],
  holidayDates: Set<string>
): AttendanceStats {
  const today = normalizeDateOnly(new Date());
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Determine the effective employment period
  const joinDate = user.dateOfJoining
    ? normalizeDateOnly(user.dateOfJoining)
    : startOfYear;
  const exitDate = user.dateOfExit
    ? normalizeDateOnly(user.dateOfExit)
    : today;

  const effectiveStart = joinDate;
  const effectiveEnd = exitDate;

  // Count total working days in the period
  const totalWorkingDays = countWorkingDays(
    effectiveStart,
    effectiveEnd,
    holidayDates
  );

  // Calculate present days from attendance records
  // Aggregate attendance per date to avoid double-counting multiple records
  // (e.g. duplicate FULL_DAY records). For each working date we compute
  // whether it's a full day (1), half day (0.5) or absent (0).
  let presentDays = 0;
  const presentMap: Record<string, { hasFull?: boolean; halves: Set<string> }> = {};

  attendanceRecords.forEach((record) => {
    const dateKey = getDateKey(record.date);
    const normalizedDate = normalizeDateOnly(record.date);
    const dayOfWeek = normalizedDate.getUTCDay();

    // Only consider attendance on working days within employment period
    if (
      dayOfWeek === 0 ||
      dayOfWeek === 6 ||
      holidayDates.has(dateKey) ||
      normalizedDate < effectiveStart ||
      normalizedDate > effectiveEnd
    ) {
      return;
    }

    if (!presentMap[dateKey]) {
      presentMap[dateKey] = { halves: new Set<string>() };
    }

    if (record.status === "FULL_DAY") {
      presentMap[dateKey].hasFull = true;
    } else if (
      record.status === "HALF_DAY_FIRST" ||
      record.status === "HALF_DAY_SECOND"
    ) {
      presentMap[dateKey].halves.add(record.status);
    }
  });

  // Sum up present days from aggregated per-date info
  Object.values(presentMap).forEach((info) => {
    if (info.hasFull) {
      presentDays += 1;
    } else if (info.halves.size >= 2) {
      presentDays += 1; // two halves make a full day
    } else if (info.halves.size === 1) {
      presentDays += 0.5;
    }
  });

  // Collect leave dates
  const leaveDates = new Set<string>();
  leaveRequests.forEach((request) => {
    const leaveStart = normalizeDateOnly(
      request.startDate < effectiveStart ? effectiveStart : request.startDate
    );
    const leaveEnd = normalizeDateOnly(
      request.endDate > effectiveEnd ? effectiveEnd : request.endDate
    );

    const rangeDates = collectWorkingDaysInRange(
      leaveStart,
      leaveEnd,
      holidayDates
    );
    rangeDates.forEach((dateKey) => leaveDates.add(dateKey));
  });

  // Collect WFH dates
  const wfhDates = new Set<string>();
  wfhRequests.forEach((request) => {
    const normalized = normalizeDateOnly(request.date);

    // Only count WFH on working days within employment period
    if (normalized < effectiveStart || normalized > effectiveEnd) {
      return;
    }

    const dateKey = getDateKey(request.date);
    // Only count WFH on working days (not weekends or holidays)
    if (normalized.getUTCDay() !== 0 && normalized.getUTCDay() !== 6 && !holidayDates.has(dateKey)) {
      wfhDates.add(dateKey);
    }
  });

  // Calculate absent days
  const computedAbsentDays = Math.max(
    0,
    totalWorkingDays - presentDays - leaveDates.size - wfhDates.size
  );

  return {
    presentDays: Number(presentDays.toFixed(1)),
    absentDays: Number(computedAbsentDays.toFixed(1)),
    leavesDays: leaveDates.size,
    workFromHomeDays: wfhDates.size,
  };
}
