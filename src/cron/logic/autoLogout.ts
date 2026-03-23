import { PrismaClient } from "@prisma/client";
import { setHours, setMinutes, setSeconds, startOfDay, endOfDay, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { sendMail } from "../../utils/mailer";  // corrected path to utils folder (up two levels)
import { getAutoLogoutWarningTemplate } from "../../utils/emailTemplates"; 

interface ExecutionSummary {
  totalUsers: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
}

/**
 * Auto Logout Cron Logic
 * Runs at 11:59 PM IST every day (NO weekend/holiday check)
 *
 * Condition:
 * - loginTime NOT NULL
 * - logoutTime IS NULL
 *
 * Action:
 * - Set logoutTime = 11:59 PM IST
 * - Set isManual = true
 * - Add remark: "Auto logout by system at 11:59 PM"
 * - Log action
 *
 * Purpose:
 * - Ensures no employee has an open attendance at EoD
 * - Prevents accidental long working hours tracking
 */
export async function executeAutoLogout(
  prisma: PrismaClient,
  // lookbackDays: how many days before today to include (helps backfill missed auto-logouts)
  lookbackDays = 1
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
    const endOfToday = endOfDay(istDate);

    // Allow a one-day lookback by default so missed days get auto-logged.
    // Example: when cron missed or timing issues occurred, this backfills yesterday's open attendances.
    const startRange = subDays(today, lookbackDays);

    // Set logout time to 11:59:59 PM IST of the target day (we'll use endOfToday for consistency)
    const logoutTime = new Date(endOfToday);
    logoutTime.setHours(23, 59, 59, 0);

    // Find all attendances that are still open (loginTime exists but logoutTime is null)
    const openAttendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startRange,
          lte: endOfToday,
        },
        loginTime: {
          not: null,
        },
        logoutTime: null,
      },
      include: {
        user: true,
      },
    });

    summary.totalUsers = openAttendances.length;

    // If no open attendances found using IST-range filtering, try a broader fallback
    if (summary.totalUsers === 0) {
      console.warn("[AUTO_LOGOUT] No open attendances found for IST range, trying fallback search (last 7 days)");

      const fallbackStart = subDays(startOfDay(istDate), 7);
      const fallbackAttendances = await prisma.attendance.findMany({
        where: {
          date: {
            gte: fallbackStart,
            lte: endOfToday,
          },
          loginTime: {
            not: null,
          },
          logoutTime: null,
        },
        include: { user: true },
      });

      if (fallbackAttendances.length > 0) {
        console.info(`[AUTO_LOGOUT] Fallback found ${fallbackAttendances.length} open attendances`);
        // use fallback results
        openAttendances.push(...fallbackAttendances);
        summary.totalUsers = openAttendances.length;
      } else {
        console.info("[AUTO_LOGOUT] No open attendances found in fallback search. Nothing to do.");
        return summary;
      }
    }

    // Process each open attendance
    for (const attendance of openAttendances) {
      try {
        await prisma.$transaction(async (tx) => {
          // Determine logout timestamp for this attendance's date (11:59:59 PM IST of the attendance date)
          const attendanceDateIst = toZonedTime(new Date(attendance.date), "Asia/Kolkata");
          const logoutForRecord = new Date(startOfDay(attendanceDateIst));
          logoutForRecord.setHours(23, 59, 59, 0);

          // Calculate total working hours
          const loginTime = new Date(attendance.loginTime || new Date());
          const diffMs = logoutForRecord.getTime() - loginTime.getTime();
          const totalWorkingHours = diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
          
          // Determine attendance status based on working hours 
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
            attendanceStatus = "ABSENT";
          }
          
          // Update attendance with auto logout
          await tx.attendance.update({
            where: { id: attendance.id },
            data: {
              logoutTime: logoutForRecord,
              totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
              status: attendanceStatus,
              isManual: true,
              remarks: attendance.remarks
                ? `${attendance.remarks}; Auto logout by system at 11:59 PM`
                : "Auto logout by system at 11:59 PM",
            },
          });

          // Log the action
          await tx.auditLog.create({
            data: {
              action: "AUTO_LOGOUT",
              entityType: "Attendance",
              entityId: attendance.id.toString(),
              description: `Auto logout executed for ${attendance.user.name} at 11:59 PM. Total working hours: ${Math.round(totalWorkingHours * 100) / 100}`,
            },
          });

          // create a warning notification for the user so they are aware of
          // the auto-logout and potential leave deduction next time
          await tx.notification.create({
            data: {
              userId: attendance.userId,
              title: "Auto Logout Notice",
              message: `You were automatically logged out at 11:59 PM because you did not logout manually. ` +
                       `Kindly logout on time in future – failure to do so will result in a 0.25 EL deduction.`,
              type: "WARNING",
              icon: "🛑",
            },
          });
        });

        // Send email to company email
        if (attendance.user.email) {
          try {
            console.log(`[AUTO_LOGOUT] Sending auto logout warning email to ${attendance.user.email}`);
            await sendMail({
              to: attendance.user.email,
              subject: "Auto Logout Notice - EL Deduction Warning",
              html: getAutoLogoutWarningTemplate(),
            });
            console.log(`[AUTO_LOGOUT] Email sent successfully to ${attendance.user.email}`);
          } catch (err) {
            console.error(`[AUTO_LOGOUT] Email failed for auto-logout to ${attendance.userId} (${attendance.user.email}):`, err);
          }
        } else {
          console.warn(`[AUTO_LOGOUT] No email found for user ${attendance.userId}`);
        }

        summary.successCount++;
      } catch (error) {
        summary.failedCount++;
        console.error(
          `Failed to auto logout user ${attendance.userId}:`,
          error
        );
      }
    }

    return summary;
  } catch (error) {
    console.error("Auto logout cron execution failed:", error);
    summary.failedCount = summary.totalUsers;
    return summary;
  }
}
