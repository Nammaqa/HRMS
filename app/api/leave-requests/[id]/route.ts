import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function decodeToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    return decoded;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

/**
 * PATCH /api/leave-requests/[id]
 * Approve or reject a leave request
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = decodeToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: typeof payload.userId === 'string' ? parseInt(payload.userId, 10) : payload.userId },
      select: { role: true },
    });

    if (admin?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, remarks } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get leave request
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: parseInt(id, 10) },
      include: { user: true },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: "Leave request not found" },
        { status: 404 }
      );
    }

    // Update leave request status
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: parseInt(id, 10) },
      data: {
        status: status as "APPROVED" | "REJECTED",
        remarks,
      },
    });

    // If approved, process the leave
    if (status === "APPROVED") {
      // Get leave balance
      let leaveBalance = await prisma.leaveBalance.findUnique({
        where: { userId: leaveRequest.userId },
      });

      if (!leaveBalance) {
        const currentYear = new Date().getFullYear();
        leaveBalance = await prisma.leaveBalance.create({
          data: {
            userId: leaveRequest.userId,
            currentYear,
            sickLeave: 5.0,
            specialLeave: 1.0,
            bereavementLeave: 5.0,
            paternityLeave: 5.0,
          },
        });
      }

      // Deduct from balance if applicable
      const leaveType = leaveRequest.leaveType;
      const requestedDays = leaveRequest.totalDays;

      console.log(`Processing leave approval: ${leaveType}, Days: ${requestedDays}, User: ${leaveRequest.userId}`);

      const updateData: any = {};

      if (leaveType === "EARNED") {
        updateData.earnedLeave = { decrement: requestedDays };
      } else if (leaveType === "SICK") {
        updateData.sickLeave = { decrement: requestedDays };
      } else if (leaveType === "SPECIAL") {
        updateData.specialLeave = { decrement: requestedDays };
      } else if (leaveType === "BEREAVEMENT") {
        updateData.bereavementLeave = { decrement: requestedDays };
        console.log(`Deducting ${requestedDays} from bereavement leave`);
      } else if (leaveType === "PATERNITY") {
        updateData.paternityLeave = { decrement: requestedDays };
        console.log(`Deducting ${requestedDays} from paternity leave`);
      } else if (leaveType === "LOSS_OF_PAY") {
        updateData.lossOfPayDays = { increment: requestedDays };
      } else if (leaveType === "COMPACT") {
        updateData.compact = { decrement: requestedDays };
      }
      // Election and other exception leaves don't deduct anything

      console.log(`Update data before update:`, JSON.stringify(updateData));

      // Update balance
      const updatedBalance = await prisma.leaveBalance.update({
        where: { userId: leaveRequest.userId },
        data: updateData,
      });

      console.log(`Balance after update:`, {
        userId: updatedBalance.userId,
        earnedLeave: updatedBalance.earnedLeave,
        sickLeave: updatedBalance.sickLeave,
        specialLeave: updatedBalance.specialLeave,
        bereavementLeave: updatedBalance.bereavementLeave,
        paternityLeave: updatedBalance.paternityLeave,
        compact: updatedBalance.compact,
        lossOfPayDays: updatedBalance.lossOfPayDays,
      });

      // Create attendance records for each day of leave
      const startDate = new Date(leaveRequest.startDate);
      const endDate = new Date(leaveRequest.endDate);

      for (
        let date = new Date(startDate);
        date <= endDate;
        date.setDate(date.getDate() + 1)
      ) {
        const attendanceDate = new Date(date);
        attendanceDate.setUTCHours(0, 0, 0, 0);

        // Check if attendance record exists
        const existingAttendance = await prisma.attendance.findUnique({
          where: {
            userId_date: {
              userId: leaveRequest.userId,
              date: attendanceDate,
            },
          },
        });

        if (!existingAttendance) {
          await prisma.attendance.create({
            data: {
              userId: leaveRequest.userId,
              date: attendanceDate,
              status: "LEAVE",
              shift: "NONE",
              isManual: true,
              remarks: `${leaveType} approved: ${leaveRequest.reason}`,
            },
          });
        }
      }

      // Create notification for employee
      const leaveTypeLower = leaveType.toLowerCase();
      await prisma.notification.create({
        data: {
          userId: leaveRequest.userId,
          title: "Leave Request Approved",
          message: `Your ${leaveTypeLower} leave request for ${requestedDays} days has been approved`,
          type: "SUCCESS",
          icon: "✅",
        },
      });
    } else {
      // Rejected - create notification
      await prisma.notification.create({
        data: {
          userId: leaveRequest.userId,
          title: "Leave Request Rejected",
          message: `Your leave request has been rejected`,
          type: "ALERT",
          icon: "❌",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Leave request ${status === "APPROVED" ? "approved" : "rejected"} successfully`,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
