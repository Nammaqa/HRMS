import { NextRequest, NextResponse } from "next/server";
import { getMonth, getYear, startOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { prisma } from "../../../../lib/prisma";
import { sendMailViaVercel } from "../../../../src/utils/vercelMailer";

const MONTHLY_ACCRUAL = 1.25;

export async function GET(request: NextRequest) {
  try {
    const istDate = toZonedTime(new Date(), "Asia/Kolkata");
    const currentMonth = getMonth(istDate);
    const currentYear = getYear(istDate);
    const today = startOfMonth(istDate);

    const leaveBalances = await prisma.leaveBalance.findMany({
      where: {
        user: {
          role: "employee",
        },
      },
      include: {
        user: true,
      },
    });

    let totalUsers = leaveBalances.length;
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const balance of leaveBalances) {
      try {
        const user = balance.user;
        const hasAccruedThisMonth = balance.lastAccrualDate
          ? getMonth(balance.lastAccrualDate) === currentMonth &&
            getYear(balance.lastAccrualDate) === currentYear
          : false;

        if (hasAccruedThisMonth) {
          skippedCount++;
          continue;
        }

        if (!balance.lastAccrualDate && user?.dateOfJoining) {
          const doj = new Date(user.dateOfJoining);
          if (getMonth(doj) === currentMonth && getYear(doj) === currentYear) {
            skippedCount++;
            continue;
          }
        }

        const newEarnedLeave = Math.min(balance.earnedLeave + MONTHLY_ACCRUAL, 30);

        await prisma.$transaction(async (tx) => {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              earnedLeave: newEarnedLeave,
              lastAccrualDate: today,
            },
          });

          await tx.auditLog.create({
            data: {
              action: "EARNED_LEAVE_ACCRUAL",
              entityType: "LeaveBalance",
              entityId: balance.id.toString(),
              description: `Earned leave accrued by ${MONTHLY_ACCRUAL} days for ${user.name}. New balance: ${newEarnedLeave} days`,
            },
          });
        });

        if (user?.email) {
          try {
            await sendMailViaVercel({
              to: user.email,
              subject: "Earned Leave Accrued",
              html: `
                <p>Dear ${user.name || "Team Member"},</p>
                <p>Your earned leave balance has been updated by <strong>${MONTHLY_ACCRUAL} days</strong>.</p>
                <p>Your new earned leave balance is <strong>${newEarnedLeave} days</strong>.</p>
                <p>If you have questions, please contact HR.</p>
                <p>Regards,<br/>HR Team</p>
              `,
            });
          } catch (mailError) {
            console.error(`[MAIL] Earned leave email failed for ${user.email}:`, mailError);
          }
        }

        successCount++;
      } catch (error) {
        failedCount++;
        console.error("[add-earned-leave] Error processing leave balance:", error);
      }
    }

    return NextResponse.json(
      {
        success: failedCount === 0,
        totalUsers,
        successCount,
        skippedCount,
        failedCount,
        message: `Processed ${successCount} accruals, skipped ${skippedCount}, failed ${failedCount}.`,
      },
      { status: failedCount === 0 ? 200 : 207 }
    );
  } catch (error) {
    console.error("[add-earned-leave] Route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to execute earned leave accrual.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
