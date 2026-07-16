import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

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

    // Get userId from token - handle both 'id' and 'userId' properties
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

    let latitude = 0;
    let longitude = 0;

    // Try to parse JSON body if available
    try {
      const body = await req.json();
      latitude = body.latitude || 0;
      longitude = body.longitude || 0;
      console.log("Check-out request body:", { latitude, longitude });
    } catch (error) {
      // If body is empty or invalid JSON, use default coordinates
      console.log("No valid request body, using default coordinates");
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, designation: true, employeeStatus: true },
    });

    if (user?.employeeStatus === "INACTIVE") {
      return NextResponse.json(
        { success: false, message: "Your account is inactive. Please contact HR.", code: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find today's attendance using unique constraint
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: today,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: "No check-in record found for today" },
        { status: 400 }
      );
    }

    if (attendance.logoutTime) {
      return NextResponse.json(
        {
          success: false,
          message: "Already checked out today. Cannot check out again.",
        },
        { status: 400 }
      );
    }

    if (!attendance.loginTime) {
      return NextResponse.json(
        { success: false, message: "Please check in first" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Calculate total working hours
    const loginTime = new Date(attendance.loginTime);
    const diffMs = now.getTime() - loginTime.getTime();
    const totalWorkingHours = diffMs / (1000 * 60 * 60); // Convert milliseconds to hours

    // Determine attendance status based on working hours
    // >= 8.5 hours: FULL_DAY
    // 4-8.5 hours: HALF_DAY_FIRST or SECOND based on login
    // < 4 hours: ABSENT
    let attendanceStatus: "FULL_DAY" | "HALF_DAY_FIRST" | "HALF_DAY_SECOND" | "ABSENT" = "HALF_DAY_FIRST";
    if (totalWorkingHours >= 8.5) {
      attendanceStatus = "FULL_DAY";
    } else if (totalWorkingHours >= 4) {
      // Determine if first or second half based on login time
      const loginHour = loginTime.getHours();
      const loginMinute = loginTime.getMinutes();
      const loginTotalMinutes = loginHour * 60 + loginMinute;
      const halfDayBreak = 12.5 * 60; // 12:30 PM in minutes
      
      attendanceStatus = loginTotalMinutes < halfDayBreak ? "HALF_DAY_FIRST" : "HALF_DAY_SECOND";
    } else {
      // If less than 4 hours, mark as absent
      attendanceStatus = "ABSENT";
    }

    // Update attendance with check-out
    const updatedAttendance = await prisma.attendance.update({
      where: {
        userId_date: {
          userId: userId,
          date: today,
        },
      },
      data: {
        logoutTime: now,
        logoutLatitude: latitude,
        logoutLongitude: longitude,
        totalWorkingHours: Math.round(totalWorkingHours * 100) / 100, // Round to 2 decimal places
        status: attendanceStatus,
        shift: "SECOND_HALF",
      },
    });

    // Format working hours for response
    const hours = Math.floor(totalWorkingHours);
    const minutes = Math.round((totalWorkingHours - hours) * 60);

    return NextResponse.json(
      {
        success: true,
        message: "Check-out successful",
        data: {
          attendanceId: updatedAttendance.id,
          logoutTime: updatedAttendance.logoutTime,
          loginTime: updatedAttendance.loginTime,
          totalWorkingHours: updatedAttendance.totalWorkingHours,
          formattedWorkingHours: `${hours}h ${minutes}m`,
          date: updatedAttendance.date,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            designation: user.designation,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
