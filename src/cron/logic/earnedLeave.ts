import { PrismaClient } from "@prisma/client";
import { startOfMonth, getMonth, getYear } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { sendMailViaVercel } from "../../utils/vercelMailer";

interface ExecutionSummary {
  totalUsers: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
}

// Fixed monthly accrual value
const MONTHLY_ACCRUAL = 1.25;

/**
 * Earned Leave Accrual Cron Logic
 * Runs at 12:00 AM IST on the 1st of every month
 *
 * Condition:
 * - Role = employee
 * - lastAccrualDate not in current month (prevents duplicate accrual)
 *
 * Action:
 * - Increment earnedLeave by 1.25 days (monthly accrual)
 * - Update lastAccrualDate to today
 * - Log action
 *
 * Notes:
 * - Maximum 30 days total (enforced in business logic)
 * - Carry forward: max 10 days within 30-day limit
 */
export async function executeEarnedLeaveAccrual(
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
    const today = startOfMonth(istDate);
    const currentMonth = getMonth(istDate);
    const currentYear = getYear(istDate);

    // Find all employee leave balances where accrual hasn't been done this month
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: {
        user: {
          role: "employee",
          employeeStatus: "ACTIVE",
        },
      },
      include: {
        user: true,
      },
    });

    summary.totalUsers = leaveBalances.length;

    if (summary.totalUsers === 0) {
      return summary;
    }

    // Process each employee
    for (const balance of leaveBalances) {
      try {
        // Check if accrual was already done this month
        if (balance.lastAccrualDate) {
          const lastMonth = getMonth(balance.lastAccrualDate);
          const lastYear = getYear(balance.lastAccrualDate);

          if (lastMonth === currentMonth && lastYear === currentYear) {
            summary.skippedCount++;
            continue; // Already accrued this month
          }
        }

        // If this is the first accrual and the employee joined this month, skip until next month
        if (!balance.lastAccrualDate && balance.user?.dateOfJoining) {
          const doj = new Date(balance.user.dateOfJoining);
          const joinMonth = getMonth(doj);
          const joinYear = getYear(doj);
          if (joinMonth === currentMonth && joinYear === currentYear) {
            summary.skippedCount++;
            continue;
          }
        }

        await prisma.$transaction(async (tx) => {
          // Increment earned leave (with 30-day max)
          const newEarnedLeave = Math.min(
            balance.earnedLeave + MONTHLY_ACCRUAL,
            30 // Max 30 days total
          );

          // Update leave balance
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              earnedLeave: newEarnedLeave,
              lastAccrualDate: today,
            },
          });

          // Log the action
          await tx.auditLog.create({
            data: {
              action: "EARNED_LEAVE_ACCRUAL",
              entityType: "LeaveBalance",
              entityId: balance.id.toString(),
              description: `Earned leave accrued by ${MONTHLY_ACCRUAL} days for ${balance.user.name}. New balance: ${newEarnedLeave} days`,
            },
          });
        });

        if (balance.user?.email) {
          try {
            console.log(`[EARNED_LEAVE] Sending accrual email to ${balance.user.email}`);
            await sendMailViaVercel({
              to: balance.user.email,
              subject: "Earned Leave Accrued",
              html: `
                <p>Dear ${balance.user.name || "Team Member"},</p>
                <p>Your earned leave balance has been updated by ${MONTHLY_ACCRUAL} days.</p>
                <p>Your new earned leave balance is <strong>${Math.min(
                  balance.earnedLeave + MONTHLY_ACCRUAL,
                  30
                )} days</strong>.</p>
                <p>If you have any questions, please contact HR.</p>
                <p>Regards,<br/>HR Team</p>
              `,
            });
            console.log(`[EARNED_LEAVE] Email sent successfully to ${balance.user.email}`);
          } catch (err) {
            console.error(
              `[EARNED_LEAVE] Email failed for ${balance.userId} (${balance.user.email}):`,
              err
            );
          }
        } else {
          console.warn(`[EARNED_LEAVE] No email found for user ${balance.userId}`);
        }

        summary.successCount++;
      } catch (error) {
        summary.failedCount++;
        console.error(
          `Failed to accrue earned leave for user ${balance.userId}:`,
          error
        );
      }
    }

    return summary;
  } catch (error) {
    console.error("Earned leave accrual cron execution failed:", error);
    summary.failedCount = summary.totalUsers;
    return summary;
  }
}
