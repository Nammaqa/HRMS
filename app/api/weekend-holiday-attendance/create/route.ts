import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { requiresWeekendHolidayApproval } from "@/lib/dateHelpers";

/**
 * POST /api/weekend-holiday-attendance/create
 * Creates a weekend/holiday attendance record that needs approval
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === "string") {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userIdString = (decoded as any).userId || (decoded as any).id;
    const userId = parseInt(userIdString, 10);

    if (!userId || isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID in token. Please login again." },
        { status: 401 }
      );
    }

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "User ID not found in token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      date,
      loginTime,
      logoutTime,
      loginLatitude,
      loginLongitude,
      logoutLatitude,
      logoutLongitude,
      totalWorkingHours,
    } = body;

    if (!date || !loginTime) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if this date requires approval
    const approvalCheck = await requiresWeekendHolidayApproval(new Date(date));

    if (!approvalCheck.requiresApproval) {
      return NextResponse.json(
        {
          success: false,
          message: "This date does not require special approval",
        },
        { status: 400 }
      );
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, designation: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Check if record already exists
    const existingRecord = await prisma.weekendHolidayAttendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: attendanceDate,
        },
      },
    });

    if (existingRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "Approval request already exists for this date",
        },
        { status: 400 }
      );
    }

    // Create new weekend/holiday attendance record
    const newRecord = await prisma.weekendHolidayAttendance.create({
      data: {
        userId,
        date: attendanceDate,
        dayType: approvalCheck.dayType || "UNKNOWN",
        holidayName: approvalCheck.holidayName,
        loginTime: new Date(loginTime),
        logoutTime: logoutTime ? new Date(logoutTime) : null,
        loginLatitude,
        loginLongitude,
        logoutLatitude,
        logoutLongitude,
        totalWorkingHours,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Approval request created successfully. Awaiting admin approval.",
        data: newRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating weekend/holiday attendance record:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
