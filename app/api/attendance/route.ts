import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Helper function to determine attendance status based on working hours
 * >= 8.5 hours: FULL_DAY
 * 4-8.5 hours: HALF_DAY (first or second based on login time)
 * < 4 hours: HALF_DAY_FIRST (removed NO_CREDIT concept)
 */
function determineAttendanceStatus(
  totalWorkingHours: number,
  loginTime: Date | null
): "FULL_DAY" | "HALF_DAY_FIRST" | "HALF_DAY_SECOND" | "ABSENT" {
  if (totalWorkingHours >= 8.5) {
    return "FULL_DAY";
  } else if (totalWorkingHours >= 4) {
    // Determine if first or second half based on login time
    if (loginTime) {
      const loginHour = loginTime.getHours();
      const loginMinute = loginTime.getMinutes();
      const loginTotalMinutes = loginHour * 60 + loginMinute;
      const halfDayBreak = 12.5 * 60; // 12:30 PM in minutes
      
      return loginTotalMinutes < halfDayBreak ? "HALF_DAY_FIRST" : "HALF_DAY_SECOND";
    }
    return "HALF_DAY_FIRST"; // Default to first half if no login time
  }
  // less than 4 hours is considered absent now
  return "ABSENT";
}

/**
 * GET /api/attendance
 * Fetches attendance records with optional filters
 * Query params:
 * - userId: Filter by specific user
 * - startDate: Filter from date (YYYY-MM-DD)
 * - endDate: Filter to date (YYYY-MM-DD)
 * - status: Filter by attendance status
 * - limit: Number of records (default: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build filter conditions
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (status) {
      where.status = status;
    }

    // Fetch attendance records with user details
    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            designation: true,
            role: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.attendance.count({ where });

    return NextResponse.json({
      data: attendance,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendance
 * Creates a new attendance record (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId: userIdRaw,
      date,
      loginTime,
      logoutTime,
      status,
      shift,
      remarks,
      loginLatitude,
      loginLongitude,
      logoutLatitude,
      logoutLongitude,
    } = body;

    // Convert userId to integer
    const userId = typeof userIdRaw === 'string' ? parseInt(userIdRaw, 10) : userIdRaw;

    // Validation
    if (!userId || !date) {
      return NextResponse.json(
        { error: "userId and date are required" },
        { status: 400 }
      );
    }

    // Status is required unless both loginTime and logoutTime are provided (auto-determined)
    if (!status && (!loginTime || !logoutTime)) {
      return NextResponse.json(
        { error: "status is required, or both loginTime and logoutTime must be provided" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if attendance already exists for this date
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: "Attendance already exists for this date" },
        { status: 409 }
      );
    }

    // Calculate total working hours and determine status
    let totalWorkingHours = 0;
    let calculatedStatus = status; // Keep provided status as fallback
    
    if (loginTime && logoutTime) {
      const login = new Date(`2000-01-01T${loginTime}`);
      const logout = new Date(`2000-01-01T${logoutTime}`);
      totalWorkingHours = (logout.getTime() - login.getTime()) / (1000 * 60 * 60);
      
      // If status is FULL_DAY or not provided, auto-determine based on hours
      if (!status || status === "FULL_DAY") {
        calculatedStatus = determineAttendanceStatus(totalWorkingHours, login);
      }
    }

    // Create attendance record
    const newAttendance = await prisma.attendance.create({
      data: {
        userId,
        date: new Date(date),
        loginTime: loginTime ? new Date(`2000-01-01T${loginTime}`) : null,
        logoutTime: logoutTime ? new Date(`2000-01-01T${logoutTime}`) : null,
        totalWorkingHours: totalWorkingHours > 0 ? totalWorkingHours : null,
        status: calculatedStatus,
        shift: shift || "NONE",
        isManual: true,
        remarks: remarks || null,
        loginLatitude: loginLatitude ? parseFloat(loginLatitude) : null,
        loginLongitude: loginLongitude ? parseFloat(loginLongitude) : null,
        logoutLatitude: logoutLatitude ? parseFloat(logoutLatitude) : null,
        logoutLongitude: logoutLongitude ? parseFloat(logoutLongitude) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            designation: true,
          },
        },
      },
    });

    return NextResponse.json(newAttendance, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance:", error);
    return NextResponse.json(
      { error: "Failed to create attendance record" },
      { status: 500 }
    );
  }
}
