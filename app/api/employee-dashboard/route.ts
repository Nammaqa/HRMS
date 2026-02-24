import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

/**
 * GET /api/employee-dashboard
 * Fetches complete employee dashboard data including:
 * - User profile info
 * - Attendance statistics
 * - Recent attendance records
 * - Holidays
 * - Pending leave/WFH requests
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify token and extract userId
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const userId = parseInt(decoded.userId, 10);
    
    // Validate userId - must be a valid number
    if (!userId || isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "Invalid user ID in token. Please login again." },
        { status: 401 }
      );
    }
    
    console.log("Dashboard - Fetching for userId:", userId);

    // Test: Get count of all users
    const userCount = await prisma.user.count();
    console.log("Total users in database:", userCount);

    // Fetch user data using findFirst instead of findUnique (Accelerate workaround)
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        currentAddress: true,
        profileImageUrl: true,
        designation: true,
        bloodGroup: true,
        location: true,
        dateOfBirth: true,
        lastLoginAt: true,
      },
    });

    console.log("Dashboard - User found:", !!user);
    console.log("Dashboard - User data:", user);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Ensure all fields exist (with defaults for new fields)
    const userWithDefaults = {
      ...user,
      phone: user.phone || undefined,
      designation: user.designation || undefined,
      bloodGroup: user.bloodGroup || undefined,
      location: user.location || undefined,
      dateOfBirth: user.dateOfBirth || undefined,
      lastLoginAt: user.lastLoginAt || undefined,
    };

    // Get current date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);

    // Fetch attendance statistics for current year
    const attendanceStats = await prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        status: true,
      },
    });

    // Calculate stats
    const stats = {
      presentDays: attendanceStats.filter(a => a.status === "FULL_DAY").length,
      absentDays: attendanceStats.filter(a => a.status === "ABSENT").length,
      leavesDays: attendanceStats.filter(a => a.status === "LEAVE").length,
      workFromHomeDays: attendanceStats.filter(a => a.status === "WFH").length,
    };

    // Fetch recent attendance (last 5 days)
    const recentAttendance = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true,
        date: true,
        status: true,
        loginTime: true,
        logoutTime: true,
      },
    });

    // Format recent attendance
    const formattedRecentAttendance = recentAttendance.map((att) => ({
      id: att.id,
      date: att.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status:
        att.status === "FULL_DAY"
          ? "Present"
          : att.status === "HALF_DAY_FIRST" || att.status === "HALF_DAY_SECOND"
          ? "Half Day"
          : att.status === "LEAVE"
          ? "Leave"
          : att.status === "WFH"
          ? "Work From Home"
          : att.status === "ABSENT"
          ? "Absent"
          : att.status === "HOLIDAY"
          ? "Holiday"
          : "Half Day",
      checkIn: att.loginTime?.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }) || "N/A",
      checkOut: att.logoutTime?.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }) || "N/A",
    }));

    // Fetch all holidays
    const holidays = await prisma.holiday.findMany({
      select: {
        id: true,
        date: true,
        name: true,
        type: true,
      },
      orderBy: { date: "asc" },
    });

    // Format holidays
    const formattedHolidays = holidays.map((h) => ({
      id: h.id,
      name: h.name,
      date: h.date.toISOString().split("T")[0],
      type: h.type.toLowerCase() as "national" | "company" | "festival" | "optional",
    }));

    // Fetch pending leave requests
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        status: "PENDING",
      },
      select: {
        id: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        reason: true,
        status: true,
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    // Format leaves
    const formattedLeaves = leaveRequests.map((leave) => ({
      id: leave.id,
      type: leave.leaveType,
      status: leave.status.toLowerCase(),
      startDate: leave.startDate.toISOString().split("T")[0],
      endDate: leave.endDate.toISOString().split("T")[0],
      reason: leave.reason || "",
    }));

    // Fetch all employees with birthdays (excluding current user)
    const allEmployees = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
        dateOfBirth: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        designation: true,
        dateOfBirth: true,
        profileImageUrl: true,
      },
    });

    // Format birthdays
    const birthdays = allEmployees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      designation: emp.designation || "Team Member",
      dateOfBirth: emp.dateOfBirth?.toISOString() || "",
      profileImageUrl: emp.profileImageUrl || undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        user: userWithDefaults,
        stats,
        recentAttendance: formattedRecentAttendance,
        holidays: formattedHolidays,
        leaves: formattedLeaves,
        birthdays,
      },
    });
  } catch (error) {
    console.error("Employee dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
