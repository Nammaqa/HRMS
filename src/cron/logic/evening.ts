import { PrismaClient } from "@prisma/client";
import { getDay, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { sendMail } from "../../utils/mailer";  // corrected path
import { 
  getEveningLogoutReminderTemplate,
  getLeaveApprovalTemplate,
  type LeaveApprovalData 
} from "../../utils/emailTemplates";

interface ExecutionSummary {
  totalUsers: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
}

/**
 * Evening Reminder Cron Logic
 * Runs at 8:30 PM IST on weekdays only
 * Skips weekends and holidays
 *
 * Two types of notifications:
 * 1) Checkout Reminder:
 *    - loginTime NOT NULL
 *    - logoutTime IS NULL
 *    - eveningReminderSent = false
 *
 * 2) Approval Notification:
 *    - LeaveRequest or WFHRequest status APPROVED or REJECTED
 *    - notificationSent = false
 *
 * Action:
 * - Create Notification
 * - Update respective flags
 * - Log everything
 */
export async function executeEveningReminder(
  prisma: PrismaClient
): Promise<ExecutionSummary> {
  const summary: ExecutionSummary = {
    totalUsers: 0,
    successCount: 0,
    skippedCount: 0,
    failedCount: 0,
  };

  try {
    const istDate = toZonedTime(new Date(), "Asia/Kolkata");
    const today = startOfDay(istDate);
    const tomorrow = endOfDay(istDate);

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = getDay(istDate);

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return summary;
    }

    // Check if today is a holiday
    const holiday = await prisma.holiday.findUnique({
      where: { date: today },
    });

    if (holiday) {
      return summary;
    }

    // 1) Send checkout reminders
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
        },
      },
      include: {
        user: true,
      },
    });

    const checkoutCount = checkoutReminders.length;

    // Process checkout reminders
    for (const attendance of checkoutReminders) {
      try {
        await prisma.$transaction(async (tx) => {
          // Create notification
          await tx.notification.create({
            data: {
              userId: attendance.userId,
              title: "Evening Reminder",
              message: "Don't forget to check out before leaving office.",
              type: "ALERT",
              icon: "",
            },
          });

          // Update flag
          await tx.attendance.update({
            where: { id: attendance.id },
            data: { eveningReminderSent: true },
          });

          // Log action
          await tx.auditLog.create({
            data: {
              action: "EVENING_REMINDER_SENT",
              entityType: "Attendance",
              entityId: attendance.id.toString(),
              description: `Evening checkout reminder sent to ${attendance.user.name}`,
            },
          });
        });

        // Send email to company email
        if (attendance.user.email) {
          await sendMail({
            to: attendance.user.email,
            subject: "Evening Reminder - Time to Log Out",
            html: getEveningLogoutReminderTemplate(),
          }).catch((err) =>
            console.error(`Email failed for ${attendance.userId}:`, err)
          );
        }

        summary.successCount++;
      } catch (error) {
        summary.failedCount++;
        console.error(
          `Failed to send evening reminder to user ${attendance.userId}:`,
          error
        );
      }
    }

    // 2) Send leave/WFH approval notifications
    const leaveApprovals = await prisma.leaveRequest.findMany({
      where: {
        status: {
          in: ["APPROVED", "REJECTED"],
        },
        notificationSent: false,
      },
      include: {
        user: true,
      },
      take: 100, // Batch processing to prevent long-running queries
    });

    for (const leave of leaveApprovals) {
      try {
        await prisma.$transaction(async (tx) => {
          const statusText =
            leave.status === "APPROVED" ? "approved" : "rejected";
          const icon = leave.status === "APPROVED" ? "✅" : "❌";

          await tx.notification.create({
            data: {
              userId: leave.userId,
              title: `Leave Request ${leave.status}`,
              message: `Your ${leave.leaveType.toLowerCase()} leave request has been ${statusText}.`,
              type: leave.status === "APPROVED" ? "SUCCESS" : "ALERT",
              icon,
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

        // Send email to company email
        if (leave.user.email) {
          const dates = leave.startDate && leave.endDate 
            ? `${leave.startDate.toLocaleDateString('en-IN')} to ${leave.endDate.toLocaleDateString('en-IN')}`
            : leave.startDate?.toLocaleDateString('en-IN') || 'TBD';
          
          const approvalData: LeaveApprovalData = {
            employeeName: leave.user.name || 'Employee',
            leaveType: leave.leaveType as 'LEAVE' | 'WFH' | 'CASUAL LEAVE' | 'SICK LEAVE' | 'PERSONAL LEAVE',
            dates,
            status: leave.status as 'APPROVED' | 'REJECTED',
          };

          await sendMail({
            to: leave.user.email,
            subject: `Leave Request ${leave.status}`,
            html: getLeaveApprovalTemplate(approvalData),
          }).catch((err) => console.error(`Email failed for ${leave.userId}:`, err));
        }

        summary.successCount++;
      } catch (error) {
        summary.failedCount++;
        console.error(
          `Failed to notify leave approval to user ${leave.userId}:`,
          error
        );
      }
    }

    // 3) Send WFH approval notifications
    const wfhApprovals = await prisma.wFHRequest.findMany({
      where: {
        status: {
          in: ["APPROVED", "REJECTED"],
        },
        notificationSent: false,
      },
      include: {
        user: true,
      },
      take: 100,
    });

    for (const wfh of wfhApprovals) {
      try {
        await prisma.$transaction(async (tx) => {
          const statusText =
            wfh.status === "APPROVED" ? "approved" : "rejected";
          const icon = wfh.status === "APPROVED" ? "✅" : "❌";

          await tx.notification.create({
            data: {
              userId: wfh.userId,
              title: `WFH Request ${wfh.status}`,
              message: `Your Work from Home request has been ${statusText}.`,
              type: wfh.status === "APPROVED" ? "SUCCESS" : "ALERT",
              icon,
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

        // Send email to company email
        if (wfh.user.email) {
          const dates = wfh.date
            ? new Date(wfh.date).toLocaleDateString('en-IN')
            : 'TBD';
          
          const approvalData: LeaveApprovalData = {
            employeeName: wfh.user.name || 'Employee',
            leaveType: 'WFH',
            dates,
            status: wfh.status as 'APPROVED' | 'REJECTED',
          };

          await sendMail({
            to: wfh.user.email,
            subject: `Work from Home (WFH) Request ${wfh.status}`,
            html: getLeaveApprovalTemplate(approvalData),
          }).catch((err) => console.error(`Email failed for ${wfh.userId}:`, err));
        }

        summary.successCount++;
      } catch (error) {
        summary.failedCount++;
        console.error(
          `Failed to notify WFH approval to user ${wfh.userId}:`,
          error
        );
      }
    }

    summary.totalUsers = checkoutCount + leaveApprovals.length + wfhApprovals.length;

    return summary;
  } catch (error) {
    console.error("Evening reminder cron execution failed:", error);
    summary.failedCount = summary.totalUsers;
    return summary;
  }
}
