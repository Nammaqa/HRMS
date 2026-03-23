import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

/**
 * GET /api/attendance/monthly?year=2026&month=1
 * Fetches all attendance records for a specific month for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify token and extract userId
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const userId = parseInt(decoded.userId, 10);

    // Validate userId - must be a valid number
    if (!userId || isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID in token. Please login again." },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    // Validate month and year
    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json(
        { success: false, error: "Invalid month or year" },
        { status: 400 }
      );
    }

    // Calculate start and end of month
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    // Fetch attendance records for the month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        date: true,
        status: true,
        loginTime: true,
        logoutTime: true,
        totalWorkingHours: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Fetch approved WFH requests for the month
    const wfhRequests = await prisma.wFHRequest.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: "APPROVED",
      },
      select: {
        date: true,
      },
    });

    // Fetch approved Leave requests for the month
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        startDate: {
          lte: endDate,
        },
        endDate: {
          gte: startDate,
        },
        status: "APPROVED",
      },
      select: {
        startDate: true,
        endDate: true,
      },
    });

    // Create maps for quick lookup
    const wfhDates = new Set(wfhRequests.map((w) => w.date.toISOString().split("T")[0]));
    
    const leaveDates = new Set<string>();
    leaveRequests.forEach((leave) => {
      const current = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      while (current <= end) {
        leaveDates.add(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
    });

    // Format attendance records and overlay WFH/Leave status
    const formattedData: Array<{
      id: number | null;
      date: string;
      status: string;
      loginTime: string | null;
      logoutTime: string | null;
      totalWorkingHours: number;
    }> = attendanceRecords.map((record) => {
      const dateStr = record.date.toISOString().split("T")[0];
      
      // Priority: Leave > WFH > Attendance Status
      let status = record.status;
      if (leaveDates.has(dateStr)) {
        status = "LEAVE";
      } else if (wfhDates.has(dateStr)) {
        status = "WFH";
      }

      return {
        id: record.id,
        date: dateStr,
        status,
        loginTime: record.loginTime?.toISOString() || null,
        logoutTime: record.logoutTime?.toISOString() || null,
        totalWorkingHours: record.totalWorkingHours || 0,
      };
    });

    // Add WFH-only records (no attendance record)
    const attendanceDates = new Set(attendanceRecords.map((a) => a.date.toISOString().split("T")[0]));
    
    wfhDates.forEach((dateStr) => {
      if (!attendanceDates.has(dateStr) && !leaveDates.has(dateStr)) {
        formattedData.push({
          id: null,
          date: dateStr,
          status: "WFH",
          loginTime: null,
          logoutTime: null,
          totalWorkingHours: 0,
        });
      }
    });

    // Add Leave-only records (no attendance record)
    leaveDates.forEach((dateStr) => {
      if (!attendanceDates.has(dateStr) && !wfhDates.has(dateStr)) {
        formattedData.push({
          id: null,
          date: dateStr,
          status: "LEAVE",
          loginTime: null,
          logoutTime: null,
          totalWorkingHours: 0,
        });
      }
    });

    // Sort by date
    formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        meta: {
          year,
          month,
          count: formattedData.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Monthly attendance fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
