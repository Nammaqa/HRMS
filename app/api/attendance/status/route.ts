import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
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

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    console.log("Status check - userId:", userId, "today date:", today);

    // Find today's attendance using unique constraint
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: today,
        },
      },
    });

    // console.log("Attendance record found:", {
    //   id: attendance.id,
    //   loginTime: attendance.loginTime,
    //   logoutTime: attendance.logoutTime,
    //   date: attendance.date,
    // });

    if (!attendance) {
      console.log("No attendance record - returning isCheckedIn: false");
      return NextResponse.json(
        {
          success: true,
          message: "No attendance record found",
          data: {
            isCheckedIn: false,
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
    }

    const isCheckedIn = !!attendance.loginTime && !attendance.logoutTime;
    console.log("Attendance logic - loginTime exists:", !!attendance.loginTime, "logoutTime is null:", !attendance.logoutTime, "Result isCheckedIn:", isCheckedIn);

    return NextResponse.json(
      {
        success: true,
        message: "Attendance status retrieved",
        data: {
          isCheckedIn,
          loginTime: attendance.loginTime,
          logoutTime: attendance.logoutTime,
          totalWorkingHours: attendance.totalWorkingHours,
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
    console.error("Status check error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
