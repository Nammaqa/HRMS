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

    // Format the response
    const formattedData = attendanceRecords.map((record) => ({
      id: record.id,
      date: record.date.toISOString().split("T")[0], // YYYY-MM-DD format
      status: record.status,
      loginTime: record.loginTime?.toISOString() || null,
      logoutTime: record.logoutTime?.toISOString() || null,
      totalWorkingHours: record.totalWorkingHours || 0,
    }));

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
