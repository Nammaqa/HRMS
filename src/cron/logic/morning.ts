import { PrismaClient } from "@prisma/client";
import { addDays, getDay, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { sendMail } from "../../utils/mailer";  // corrected path
import { 
  getGoodMorningReminderTemplate, 
  getMidMorningReminderTemplate 
} from "../../utils/emailTemplates";

interface ExecutionSummary {
  totalUsers: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
}

/**
 * Morning Reminder Cron Logic
 * Runs at 9:30 AM IST on weekdays (Mon-Fri) only
 * Skips admin-defined holidays
 *
 * Conditions:
 * - Role must be employee
 * - Attendance exists for today
 * - loginTime IS NULL (not yet logged in)
 * - morningReminderSent = false
 *
 * Action:
 * - Create Notification
 * - Set morningReminderSent = true
 * - Log in AuditLog
 */
export async function executeMorningReminder(
  prisma: PrismaClient
): Promise<ExecutionSummary> {
  const summary: ExecutionSummary = {
    totalUsers: 0,
    successCount: 0,
    skippedCount: 0,
    failedCount: 0,
  };

  try {
    // Get current date in IST
    const istDate = toZonedTime(new Date(), "Asia/Kolkata");
    const today = startOfDay(istDate);
    const tomorrow = endOfDay(istDate);

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = getDay(istDate);

    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return summary;
    }

    // Check if today is an admin-defined holiday
    const holiday = await prisma.holiday.findUnique({
      where: { date: today },
    });

    if (holiday) {
      return summary;
    }

    // Fetch all employees with attendance for today who haven't logged in
    const eligibleAttendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        loginTime: null,
        morningReminderSent: false,
        user: {
          role: "employee",
        },
      },
      include: {
        user: true,
      },
    });

    // Also find users who do NOT have an attendance record for today
    const usersWithoutAttendance = await prisma.user.findMany({
      where: {
        role: "employee",
        attendances: {
          none: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
        },
      },
      take: 500,
    });

    // Total targets = attendances without login + users who haven't any attendance today
    summary.totalUsers = eligibleAttendances.length + usersWithoutAttendance.length;

    // Process attendance-based reminders
    for (const attendance of eligibleAttendances) {
      try {
        // Use transaction for atomicity
        await prisma.$transaction(async (tx) => {
          // Create notification
          await tx.notification.create({
            data: {
              userId: attendance.userId,
              title: "Morning Reminder",
              message: "Good morning! Don't forget to check in for the day.",
              type: "ALERT",
              icon: "🌅",
            },
          });

          // Update attendance reminder flag
          await tx.attendance.update({
            where: { id: attendance.id },
            data: { morningReminderSent: true },
          });

          // Log the action
          await tx.auditLog.create({
            data: {
              action: "MORNING_REMINDER_SENT",
              entityType: "Attendance",
              entityId: attendance.id.toString(),
              description: `Morning reminder sent to ${attendance.user.name}`,
            },
          });
        });

        // Send email to company email
        if (attendance.user.email) {
          await sendMail({
            to: attendance.user.email,
            subject: "Good Morning! - Attendance Reminder",
            html: getGoodMorningReminderTemplate(),
          }).catch((err) =>
            console.error(`Email failed for ${attendance.userId}:`, err)
          );
        }

        summary.successCount++;
      } catch (error) {
        summary.failedCount++;
        console.error(
          `Failed to send morning reminder to user ${attendance.userId}:`,
          error
        );
      }
    }

    // Process users without attendance (send notification, avoid duplicates)
    for (const user of usersWithoutAttendance) {
      try {
        // Skip if a morning reminder notification already exists for this user today
        const existing = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            title: "Morning Reminder",
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        });

        if (existing) {
          summary.skippedCount++;
          continue;
        }

        await prisma.$transaction(async (tx) => {
          await tx.notification.create({
            data: {
              userId: user.id,
              title: "Morning Reminder",
              message: "Good morning! Don't forget to check in for the day.",
              type: "ALERT",
              icon: "🌅",
            },
          });

          await tx.auditLog.create({
            data: {
              action: "MORNING_REMINDER_SENT",
              entityType: "User",
              entityId: user.id.toString(),
              description: `Morning reminder sent to ${user.name} (no attendance record)`,
            },
          });
        });

        // Send email to company email
        if (user.email) {
          await sendMail({
            to: user.email,
            subject: "Action Required - Please Mark Your Attendance",
            html: getMidMorningReminderTemplate(),
          }).catch((err) => console.error(`Email failed for ${user.id}:`, err));
        }

        summary.successCount++;
      } catch (error) {
        summary.failedCount++;
        console.error(`Failed to send morning reminder to user ${user.id}:`, error);
      }
    }

    return summary;
  } catch (error) {
    console.error("Morning reminder cron execution failed:", error);
    summary.failedCount = summary.totalUsers;
    return summary;
  }
}


// test