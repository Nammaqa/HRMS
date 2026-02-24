import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/attendance/auto-checkout
 * 
 * Auto-checkout for employees who didn't check out by 11:59 PM
 * Run this endpoint daily at 11:59 PM via a cron job
 */
export async function POST(req: NextRequest) {
  try {
    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find all incomplete attendances (from today AND all past dates)
    // These are employees who checked in but never checked out
    const incompleteAttendance = await prisma.attendance.findMany({
      where: {
        loginTime: {
          not: null, // Must have checked in
        },
        logoutTime: null, // But hasn't checked out
      },
      include: {
        user: true,
      },
      orderBy: {
        date: "desc", // Process most recent first
      },
    });

    let autoCheckedOut = 0;
    const results: any[] = [];

    // Process each incomplete attendance
    for (const att of incompleteAttendance) {
      try {
        const loginTime = new Date(att.loginTime!);
        
        // Set checkout time to 11:59:59 PM on the attendance date
        const checkoutTime = new Date(att.date);
        checkoutTime.setUTCHours(23, 59, 59, 0);
        
        const diffMs = checkoutTime.getTime() - loginTime.getTime();
        const totalWorkingHours = Math.max(0, diffMs / (1000 * 60 * 60));

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

        // Step 1: Auto-checkout the employee
        const updatedAttendance = await prisma.attendance.update({
          where: { id: att.id },
          data: {
            logoutTime: checkoutTime,
            totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
            status: attendanceStatus,
            remarks: "Auto-checkout at 11:59 PM",
          },
        });

        // Step 2: Create notification for employee
        await prisma.notification.create({
          data: {
            userId: att.userId,
            title: "Auto Check-Out Completed",
            message: `You were auto-checked out at 23:59 for not checking out manually. Working hours: ${totalWorkingHours.toFixed(2)}h. Status: ${attendanceStatus}. ` +
                     `Please logout on time in future; failing to do so may incur a 0.25 EL deduction.`,
            type: "WARNING",
            icon: "⚠️",
          },
        });

        autoCheckedOut++;

        results.push({
          userId: att.userId,
          userName: att.user.name,
          attendanceId: att.id,
          status: "success",
          totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
          notificationSent: true,
        });
      } catch (error) {
        console.error(`Error processing auto-checkout for user ${att.userId}:`, error);
        results.push({
          userId: att.userId,
          userName: att.user.name,
          status: "error",
          error: (error as any).message,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Auto-checkout completed. ${autoCheckedOut} employee(s) processed.`,
        data: {
          totalProcessed: autoCheckedOut,
          timestamp: new Date().toISOString(),
          results,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auto-checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attendance/auto-checkout
 * 
 * Check status of auto-checkout (view pending checkouts)
 */
export async function GET(req: NextRequest) {
  try {
    // Find all employees who need auto-checkout (from today AND all past dates)
    const pendingCheckouts = await prisma.attendance.findMany({
      where: {
        loginTime: {
          not: null, // Must have checked in
        },
        logoutTime: null, // But hasn't checked out
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
      orderBy: {
        date: "desc", // Show most recent first
      },
    });

    return NextResponse.json({
      success: true,
      message: `${pendingCheckouts.length} employee(s) pending auto-checkout`,
      data: pendingCheckouts.map((att: typeof pendingCheckouts[0]) => ({
        attendanceId: att.id,
        userId: att.user.id,
        userName: att.user.name,
        userEmail: att.user.email,
        designation: att.user.designation,
        loginTime: att.loginTime,
        timeWithoutCheckout: new Date().getTime() - new Date(att.loginTime!).getTime(),
      })),
    });
  } catch (error) {
    console.error("Get pending checkouts error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
