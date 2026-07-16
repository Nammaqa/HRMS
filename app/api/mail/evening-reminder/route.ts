import { NextRequest, NextResponse } from "next/server";
import { getDay, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { prisma } from "../../../../lib/prisma";
import { sendMailViaVercel } from "../../../../src/utils/vercelMailer";
import {
  getEveningLogoutReminderTemplate,
  getLeaveApprovalTemplate,
  type LeaveApprovalData,
} from "../../../../src/utils/emailTemplates";

export async function GET(request: NextRequest) {
  try {
    const istDate = toZonedTime(new Date(), "Asia/Kolkata");
    const today = startOfDay(istDate);
    const tomorrow = endOfDay(istDate);
    const dayOfWeek = getDay(istDate);

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json({ success: true, totalUsers: 0, successCount: 0, skippedCount: 0, failedCount: 0, message: "Weekend - no evening reminders." });
    }

    const holiday = await prisma.holiday.findUnique({ where: { date: today } });
    if (holiday) {
      return NextResponse.json({ success: true, totalUsers: 0, successCount: 0, skippedCount: 0, failedCount: 0, message: "Holiday - no evening reminders." });
    }

    const checkoutReminders = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        loginTime: {
          not: null,
        },
        logoutTime: null,
        eveningReminderSent: false,
        user: {
          role: "employee",
          employeeStatus: "ACTIVE",
        },
      },
      include: {
        user: true,
      },
    });

    let successCount = 0;
    let failedCount = 0;

    for (const attendance of checkoutReminders) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.notification.create({
            data: {
              userId: attendance.userId,
              title: "Evening Reminder",
              message: "Don't forget to check out before leaving office.",
              type: "ALERT",
              icon: "",
            },
          });

          await tx.attendance.update({
            where: { id: attendance.id },
            data: { eveningReminderSent: true },
          });

          await tx.auditLog.create({
            data: {
              action: "EVENING_REMINDER_SENT",
              entityType: "Attendance",
              entityId: attendance.id.toString(),
              description: `Evening checkout reminder sent to ${attendance.user.name}`,
            },
          });
        });

        if (attendance.user.email) {
          try {
            await sendMailViaVercel({
              to: attendance.user.email,
              subject: "Evening Reminder - Time to Log Out",
              html: getEveningLogoutReminderTemplate(),
            });
          } catch (mailError) {
            console.error(`[MAIL] Evening reminder email failed for ${attendance.user.email}:`, mailError);
          }
        }

        successCount++;
      } catch (error) {
        failedCount++;
        console.error("[evening-reminder] Error sending checkout reminder:", error);
      }
    }

    const leaveApprovals = await prisma.leaveRequest.findMany({
      where: {
        status: {
          in: ["APPROVED", "REJECTED"],
        },
        notificationSent: false,
        user: { employeeStatus: "ACTIVE" },
      },
      include: {
        user: true,
      },
      take: 100,
    });

    for (const leave of leaveApprovals) {
      try {
        await prisma.$transaction(async (tx) => {
          const statusText = leave.status === "APPROVED" ? "approved" : "rejected";
          await tx.notification.create({
            data: {
              userId: leave.userId,
              title: `Leave Request ${leave.status}`,
              message: `Your leave request has been ${statusText}.`,
              type: leave.status === "APPROVED" ? "SUCCESS" : "ALERT",
              icon: leave.status === "APPROVED" ? "✅" : "❌",
            },
          });

          await tx.leaveRequest.update({
            where: { id: leave.id },
            data: { notificationSent: true },
          });

          await tx.auditLog.create({
            data: {
              action: "LEAVE_APPROVAL_NOTIFIED",
              entityType: "LeaveRequest",
              entityId: leave.id.toString(),
              description: `Leave approval notification sent to ${leave.user.name}`,
            },
          });
        });

        if (leave.user.email) {
          try {
            const dates = leave.startDate && leave.endDate
              ? `${leave.startDate.toLocaleDateString('en-IN')} to ${leave.endDate.toLocaleDateString('en-IN')}`
              : leave.startDate?.toLocaleDateString('en-IN') || 'TBD';

            const approvalData: LeaveApprovalData = {
              employeeName: leave.user.name || 'Employee',
              leaveType: leave.leaveType as 'LEAVE' | 'WFH' | 'CASUAL LEAVE' | 'SICK LEAVE' | 'PERSONAL LEAVE',
              dates,
              status: leave.status as 'APPROVED' | 'REJECTED',
            };

            await sendMailViaVercel({
              to: leave.user.email,
              subject: `Leave Request ${leave.status}`,
              html: getLeaveApprovalTemplate(approvalData),
            });
          } catch (mailError) {
            console.error(`[MAIL] Leave approval email failed for ${leave.user.email}:`, mailError);
          }
        }

        successCount++;
      } catch (error) {
        failedCount++;
        console.error("[evening-reminder] Error sending leave approval notification:", error);
      }
    }

    const wfhApprovals = await prisma.wFHRequest.findMany({
      where: {
        status: {
          in: ["APPROVED", "REJECTED"],
        },
        notificationSent: false,
        user: { employeeStatus: "ACTIVE" },
      },
      include: {
        user: true,
      },
      take: 100,
    });

    for (const wfh of wfhApprovals) {
      try {
        await prisma.$transaction(async (tx) => {
          const statusText = wfh.status === "APPROVED" ? "approved" : "rejected";
          await tx.notification.create({
            data: {
              userId: wfh.userId,
              title: `WFH Request ${wfh.status}`,
              message: `Your Work from Home request has been ${statusText}.`,
              type: wfh.status === "APPROVED" ? "SUCCESS" : "ALERT",
              icon: wfh.status === "APPROVED" ? "✅" : "❌",
            },
          });

          await tx.wFHRequest.update({
            where: { id: wfh.id },
            data: { notificationSent: true },
          });

          await tx.auditLog.create({
            data: {
              action: "WFH_APPROVAL_NOTIFIED",
              entityType: "WFHRequest",
              entityId: wfh.id.toString(),
              description: `WFH approval notification sent to ${wfh.user.name}`,
            },
          });
        });

        if (wfh.user.email) {
          try {
            const dates = wfh.date
              ? new Date(wfh.date).toLocaleDateString('en-IN')
              : 'TBD';

            const approvalData: LeaveApprovalData = {
              employeeName: wfh.user.name || 'Employee',
              leaveType: 'WFH',
              dates,
              status: wfh.status as 'APPROVED' | 'REJECTED',
            };

            await sendMailViaVercel({
              to: wfh.user.email,
              subject: `Work from Home Request ${wfh.status}`,
              html: getLeaveApprovalTemplate(approvalData),
            });
          } catch (mailError) {
            console.error(`[MAIL] WFH approval email failed for ${wfh.user.email}:`, mailError);
          }
        }

        successCount++;
      } catch (error) {
        failedCount++;
        console.error("[evening-reminder] Error sending WFH approval notification:", error);
      }
    }

    const totalUsers = checkoutReminders.length + leaveApprovals.length + wfhApprovals.length;
    return NextResponse.json(
      {
        success: failedCount === 0,
        totalUsers,
        successCount,
        failedCount,
        message: `Evening reminder processing complete. ${successCount} succeeded, ${failedCount} failed.`,
      },
      { status: failedCount === 0 ? 200 : 207 }
    );
  } catch (error) {
    console.error("[evening-reminder] Route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to execute evening reminders.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
