import { NextRequest, NextResponse } from "next/server";
import { endOfDay, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { prisma } from "../../../../lib/prisma";
import { sendMailViaVercel } from "../../../../src/utils/vercelMailer";
import { getAutoLogoutWarningTemplate } from "../../../../src/utils/emailTemplates";

export async function GET(request: NextRequest) {
  try {
    const istDate = toZonedTime(new Date(), "Asia/Kolkata");
    const today = startOfDay(istDate);
    const endOfToday = endOfDay(istDate);

    const openAttendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lte: endOfToday,
        },
        loginTime: {
          not: null,
        },
        logoutTime: null,
        user: { employeeStatus: "ACTIVE" },
      },
      include: {
        user: true,
      },
    });

    let totalUsers = openAttendances.length;
    let successCount = 0;
    let failedCount = 0;

    for (const attendance of openAttendances) {
      try {
        const logoutForRecord = new Date(endOfToday);
        logoutForRecord.setHours(23, 59, 59, 0);

        const loginTime = new Date(attendance.loginTime || new Date());
        const diffMs = logoutForRecord.getTime() - loginTime.getTime();
        const totalWorkingHours = Math.max(0, diffMs / (1000 * 60 * 60));

        let attendanceStatus: "FULL_DAY" | "HALF_DAY_FIRST" | "HALF_DAY_SECOND" | "ABSENT" =
          totalWorkingHours >= 8.5
            ? "FULL_DAY"
            : totalWorkingHours >= 4
            ? "HALF_DAY_FIRST"
            : "ABSENT";

        await prisma.$transaction(async (tx) => {
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

          await tx.auditLog.create({
            data: {
              action: "AUTO_LOGOUT",
              entityType: "Attendance",
              entityId: attendance.id.toString(),
              description: `Auto logout executed for ${attendance.user.name} at 11:59 PM. Total working hours: ${Math.round(
                totalWorkingHours * 100
              ) / 100}`,
            },
          });

          await tx.notification.create({
            data: {
              userId: attendance.userId,
              title: "Auto Logout Notice",
              message:
                "You were automatically logged out at 11:59 PM because you did not logout manually. Please logout on time in future.",
              type: "WARNING",
              icon: "🛑",
            },
          });
        });

        if (attendance.user.email) {
          try {
            await sendMailViaVercel({
              to: attendance.user.email,
              subject: "Auto Logout Notice",
              html: getAutoLogoutWarningTemplate(),
            });
          } catch (mailError) {
            console.error(`[MAIL] Auto logout email failed for ${attendance.user.email}:`, mailError);
          }
        }

        successCount++;
      } catch (error) {
        failedCount++;
        console.error("[auto-logout] Error auto logging out attendance:", error);
      }
    }

    return NextResponse.json(
      {
        success: failedCount === 0,
        totalUsers,
        successCount,
        failedCount,
        message: `Auto logout completed for ${successCount} attendances, failed ${failedCount}.`,
      },
      { status: failedCount === 0 ? 200 : 207 }
    );
  } catch (error) {
    console.error("[auto-logout] Route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to execute auto logout.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
