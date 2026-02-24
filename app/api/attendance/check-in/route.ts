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
    const userId = (decoded as any).userId || (decoded as any).id;
    
    if (!userId) {
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
      console.log("Check-in request body:", { latitude, longitude });
    } catch (error) {
      // If body is empty or invalid JSON, use default coordinates
      console.log("No valid request body, using default coordinates");
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

    // Check if already checked in today using the unique constraint
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: today,
        },
      },
    });

    if (existingAttendance && existingAttendance.loginTime) {
      console.log("User already checked in today");
      return NextResponse.json(
        {
          success: false,
          message: "Already checked in today. Cannot check in again.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Create or update attendance record with check-in
    let attendance;
    
    if (existingAttendance) {
      // Update existing record
      console.log("Updating existing attendance record");
      attendance = await prisma.attendance.update({
        where: {
          userId_date: {
            userId: userId,
            date: today,
          },
        },
        data: {
          loginTime: now,
          loginLatitude: latitude,
          loginLongitude: longitude,
          status: "FULL_DAY",
          shift: "FIRST_HALF",
        },
      });
    } else {
      // Create new record
      console.log("Creating new attendance record for", userId, "on", today);
      attendance = await prisma.attendance.create({
        data: {
          userId: userId,
          date: today,
          loginTime: now,
          loginLatitude: latitude,
          loginLongitude: longitude,
          status: "FULL_DAY",
          shift: "FIRST_HALF",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Check-in successful",
        data: {
          attendanceId: attendance.id,
          loginTime: attendance.loginTime,
          date: attendance.date,
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
    console.error("Check-in error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
