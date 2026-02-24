import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

/**
 * PATCH /api/weekend-holiday-attendance/[id]
 * Approve or reject weekend/holiday attendance
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const adminIdString = (decoded as any).userId || (decoded as any).id;
    const adminId = parseInt(adminIdString, 10);
    const userRole = (decoded as any).role;

    if (!adminId || isNaN(adminId) || adminId <= 0 || userRole !== "admin") {
      return NextResponse.json(
        { success: false, message: "Invalid user ID or admin access required" },
        { status: 403 }
      );
    }

    if (!adminId || isNaN(adminId) || userRole !== "admin") {
      return NextResponse.json(
        { success: false, message: "Only admins can approve/reject" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, approvalReason } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // Find the attendance record
    const attendanceRecord = await prisma.weekendHolidayAttendance.findUnique({
      where: { id: parseInt(id, 10) },
      include: { user: true },
    });

    if (!attendanceRecord) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found" },
        { status: 404 }
      );
    }

    if (attendanceRecord.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot modify ${attendanceRecord.status} record`,
        },
        { status: 400 }
      );
    }

    // Update the record
    const updatedRecord = await prisma.weekendHolidayAttendance.update({
      where: { id: parseInt(id, 10) },
      data: {
        status,
        approvalReason,
        approvedBy: adminId.toString(),
        approvedAt: new Date(),
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

    // If approved, create/update attendance record
    if (status === "APPROVED") {
      const attendanceDate = new Date(attendanceRecord.date);
      attendanceDate.setUTCHours(0, 0, 0, 0);

      // Check if attendance record already exists for this day
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: attendanceRecord.userId,
            date: attendanceDate,
          },
        },
      });

      if (existingAttendance) {
        // Update existing attendance record
        await prisma.attendance.update({
          where: {
            userId_date: {
              userId: attendanceRecord.userId,
              date: attendanceDate,
            },
          },
          data: {
            status: "FULL_DAY",
            totalWorkingHours: attendanceRecord.totalWorkingHours,
            loginTime: attendanceRecord.loginTime,
            logoutTime: attendanceRecord.logoutTime,
            loginLatitude: attendanceRecord.loginLatitude,
            loginLongitude: attendanceRecord.loginLongitude,
            logoutLatitude: attendanceRecord.logoutLatitude,
            logoutLongitude: attendanceRecord.logoutLongitude,
            isManual: true,
            remarks: `Weekend/Holiday attendance approved: ${attendanceRecord.dayType}${
              attendanceRecord.holidayName ? ` (${attendanceRecord.holidayName})` : ""
            }`,
          },
        });
      } else {
        // Create new attendance record
        await prisma.attendance.create({
          data: {
            userId: attendanceRecord.userId,
            date: attendanceDate,
            status: "FULL_DAY",
            shift: "FIRST_HALF",
            totalWorkingHours: attendanceRecord.totalWorkingHours,
            loginTime: attendanceRecord.loginTime,
            logoutTime: attendanceRecord.logoutTime,
            loginLatitude: attendanceRecord.loginLatitude,
            loginLongitude: attendanceRecord.loginLongitude,
            logoutLatitude: attendanceRecord.logoutLatitude,
            logoutLongitude: attendanceRecord.logoutLongitude,
            isManual: true,
            remarks: `Weekend/Holiday attendance approved: ${attendanceRecord.dayType}${
              attendanceRecord.holidayName ? ` (${attendanceRecord.holidayName})` : ""
            }`,
          },
        });
      }

      // Award comp-off days if it was approved
      const leaveBalance = await prisma.leaveBalance.findUnique({
        where: { userId: attendanceRecord.userId },
      });

      if (leaveBalance) {
        await prisma.leaveBalance.update({
          where: { userId: attendanceRecord.userId },
          data: {
            compact: (leaveBalance.compact || 0) + 1, // Add 1 comp-off day
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Attendance ${status.toLowerCase()} successfully`,
        data: updatedRecord,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating weekend/holiday attendance:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
