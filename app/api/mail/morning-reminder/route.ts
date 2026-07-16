import { NextRequest, NextResponse } from "next/server";
import { getDay, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { prisma } from "../../../../lib/prisma";
import { sendMailViaVercel } from "../../../../src/utils/vercelMailer";
import {
  getGoodMorningReminderTemplate,
  getMidMorningReminderTemplate,
} from "../../../../src/utils/emailTemplates";

export async function GET(request: NextRequest) {
  try {
    const istDate = toZonedTime(new Date(), "Asia/Kolkata");
    const today = startOfDay(istDate);
    const tomorrow = endOfDay(istDate);
    const dayOfWeek = getDay(istDate);

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json({ success: true, totalUsers: 0, successCount: 0, skippedCount: 0, failedCount: 0, message: "Weekend - no morning reminders." });
    }

    const holiday = await prisma.holiday.findUnique({ where: { date: today } });
    if (holiday) {
      return NextResponse.json({ success: true, totalUsers: 0, successCount: 0, skippedCount: 0, failedCount: 0, message: "Holiday - no morning reminders." });
    }

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
          employeeStatus: "ACTIVE",
        },
      },
      include: {
        user: true,
      },
    });

    const usersWithoutAttendance = await prisma.user.findMany({
      where: {
        role: "employee",
        employeeStatus: "ACTIVE",
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

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const attendance of eligibleAttendances) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.notification.create({
            data: {
              userId: attendance.userId,
              title: "Morning Reminder",
              message: "Good morning! Don't forget to check in for the day.",
              type: "ALERT",
              icon: "🌅",
            },
          });

          await tx.attendance.update({
            where: { id: attendance.id },
            data: { morningReminderSent: true },
          });

          await tx.auditLog.create({
            data: {
              action: "MORNING_REMINDER_SENT",
              entityType: "Attendance",
              entityId: attendance.id.toString(),
              description: `Morning reminder sent to ${attendance.user.name}`,
            },
          });
        });

        if (attendance.user.email) {
          try {
            await sendMailViaVercel({
              to: attendance.user.email,
              subject: "Good Morning! - Attendance Reminder",
              html: getGoodMorningReminderTemplate(),
            });
          } catch (mailError) {
            console.error(`[MAIL] Morning reminder email failed for ${attendance.user.email}:`, mailError);
          }
        }

        successCount++;
      } catch (error) {
        failedCount++;
        console.error("[morning-reminder] Error sending attendance reminder:", error);
      }
    }

    for (const user of usersWithoutAttendance) {
      try {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            title: "Morning Reminder",
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        });

        if (existingNotification) {
          skippedCount++;
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
              description: `Morning reminder sent to ${user.name} (no attendance record).`,
            },
          });
        });

        if (user.email) {
          try {
            await sendMailViaVercel({
              to: user.email,
              subject: "Action Required - Please Mark Your Attendance",
              html: getMidMorningReminderTemplate(),
            });
          } catch (mailError) {
            console.error(`[MAIL] Morning reminder email failed for ${user.email}:`, mailError);
          }
        }

        successCount++;
      } catch (error) {
        failedCount++;
        console.error("[morning-reminder] Error sending attendance-free reminder:", error);
      }
    }

    const totalUsers = eligibleAttendances.length + usersWithoutAttendance.length;
    return NextResponse.json(
      {
        success: failedCount === 0,
        totalUsers,
        successCount,
        skippedCount,
        failedCount,
        message: `Morning reminders processed for ${successCount} users, skipped ${skippedCount}, failed ${failedCount}.`,
      },
      { status: failedCount === 0 ? 200 : 207 }
    );
  } catch (error) {
    console.error("[morning-reminder] Route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to execute morning reminders.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
