import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDateKey, normalizeDateOnly, collectWorkingDaysInRange } from "@/lib/attendanceCalculations";
import type { AttendanceStatus } from "@prisma/client";

const PRESENT_STATUS = ["FULL_DAY", "HALF_DAY_FIRST", "HALF_DAY_SECOND"] as AttendanceStatus[];
const APPROVED_STATUS = "APPROVED";

export async function GET() {
  try {
    // Fetch all employees
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["employee", "intern"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        dateOfJoining: true,
        dateOfExit: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const userIds = users.map((user) => user.id);

    // Fetch all holidays
    const holidays = await prisma.holiday.findMany({
      select: { date: true },
    });
    const holidayDates = new Set(holidays.map((holiday) => getDateKey(holiday.date)));

    // Fetch ALL attendance records (including both present and absent)
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        userId: true,
        status: true,
        date: true,
      },
    });

    // Fetch approved leave requests for all employees
    const approvedLeaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId: { in: userIds },
        status: APPROVED_STATUS,
      },
      select: {
        userId: true,
        startDate: true,
        endDate: true,
      },
    });

    // Fetch approved WFH requests for all employees
    const approvedWfhRequests = await prisma.wFHRequest.findMany({
      where: {
        userId: { in: userIds },
        status: APPROVED_STATUS,
      },
      select: {
        userId: true,
        date: true,
      },
    });

    // Group records by user for efficient lookup
    const attendanceByUser = new Map<number, Array<{ date: Date; status: string }>>();
    attendanceRecords.forEach((record) => {
      const bucket = attendanceByUser.get(record.userId) ?? [];
      bucket.push({ date: record.date, status: record.status });
      attendanceByUser.set(record.userId, bucket);
    });

    const leaveByUser = new Map<number, Array<{ startDate: Date; endDate: Date }>>();
    approvedLeaveRequests.forEach((request) => {
      const bucket = leaveByUser.get(request.userId) ?? [];
      bucket.push({ startDate: request.startDate, endDate: request.endDate });
      leaveByUser.set(request.userId, bucket);
    });

    const wfhByUser = new Map<number, Array<{ date: Date }>>();
    approvedWfhRequests.forEach((request) => {
      const bucket = wfhByUser.get(request.userId) ?? [];
      bucket.push({ date: request.date });
      wfhByUser.set(request.userId, bucket);
    });

    // Calculate stats for each employee
    const today = normalizeDateOnly(new Date());
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const yearStart = normalizeDateOnly(startOfYear);

    // Get all working days from Jan 1 to today (Monday-Friday, excluding holidays)
    const allWorkingDaysInYear = collectWorkingDaysInRange(yearStart, today, holidayDates);

    const summary = users.map((user) => {
      const userAttendance = attendanceByUser.get(user.id) ?? [];
      const userLeaves = leaveByUser.get(user.id) ?? [];
      const userWfh = wfhByUser.get(user.id) ?? [];

      // Calculate PRESENT DAYS: count all records with present status
      let presentDays = 0;
      const attendanceDateKeys = new Set<string>();
      
      userAttendance.forEach((record) => {
        const dateKey = getDateKey(record.date);
        attendanceDateKeys.add(dateKey);
        
        if (PRESENT_STATUS.includes(record.status as any)) {
          if (record.status === "FULL_DAY") {
            presentDays += 1;
          } else if (record.status === "HALF_DAY_FIRST" || record.status === "HALF_DAY_SECOND") {
            presentDays += 0.5;
          }
        }
      });

      // Calculate LEAVE DAYS: approved leave days
      let leaveDays = 0;
      const leaveDateKeys = new Set<string>();
      
      userLeaves.forEach((request) => {
        const leaveStart = normalizeDateOnly(request.startDate);
        const leaveEnd = normalizeDateOnly(request.endDate);
        
        // Limit to Jan 1 to today
        const effectiveStart = leaveStart < yearStart ? yearStart : leaveStart;
        const effectiveEnd = leaveEnd > today ? today : leaveEnd;
        
        const rangeDates = collectWorkingDaysInRange(
          effectiveStart,
          effectiveEnd,
          holidayDates
        );
        rangeDates.forEach((dateKey) => {
          leaveDateKeys.add(dateKey);
          leaveDays += 1;
        });
      });

      // Calculate WFH DAYS: approved WFH days
      let wfhDays = 0;
      const wfhDateKeys = new Set<string>();
      
      userWfh.forEach((request) => {
        const normalized = normalizeDateOnly(request.date);
        
        // Only count from Jan 1 to today
        if (normalized >= yearStart && normalized <= today) {
          const dateKey = getDateKey(request.date);
          const dayOfWeek = normalized.getUTCDay();
          
          // Only count on working days (Monday-Friday, not holidays)
          if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateKey)) {
            wfhDateKeys.add(dateKey);
            wfhDays += 1;
          }
        }
      });

      // Calculate ABSENT DAYS: working days with NO attendance record, NO leave, NO WFH
      let absentDays = 0;
      allWorkingDaysInYear.forEach((dateKey) => {
        // If day has no attendance, no leave, and no WFH, it's absent
        if (!attendanceDateKeys.has(dateKey) && !leaveDateKeys.has(dateKey) && !wfhDateKeys.has(dateKey)) {
          absentDays += 1;
        }
      });

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        totalPresentDays: Number(presentDays.toFixed(1)),
        totalAbsentDays: absentDays,
        totalLeaveDays: leaveDays,
        totalWFHDays: wfhDays,
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to calculate employee summary:", error);
    return NextResponse.json(
      { error: "Unable to calculate employee summary" },
      { status: 500 }
    );
  }
}
