import { PrismaClient } from "@prisma/client";
import { executeMorningReminder } from "./logic/morning";
import { executeEveningReminder } from "./logic/evening";
import { executeAutoLogout } from "./logic/autoLogout";
import { executeEarnedLeaveAccrual } from "./logic/earnedLeave";

const prisma = new PrismaClient();

export type CronJobType =
  | "morning-reminder"
  | "evening-reminder"
  | "auto-logout"
  | "add-earned-leave";

interface ExecutionResult {
  success: boolean;
  cronName: string;
  totalUsers: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  duration: number; // in milliseconds
  message: string;
  timestamp: string;
}

/**
 * Execute a specific cron job
 * This is the main entry point called by both:
 * 1) Vercel API routes (testing/staging)
 * 2) Node-cron (DigitalOcean production)
 */
export async function executeCronJob(
  jobType: CronJobType
): Promise<ExecutionResult> {
  const startTime = new Date().getTime();
  let summary;

  try {
    switch (jobType) {
      case "morning-reminder":
        summary = await executeMorningReminder(prisma);
        break;

      case "evening-reminder":
        summary = await executeEveningReminder(prisma);
        break;

      case "auto-logout":
        summary = await executeAutoLogout(prisma);
        break;

      case "add-earned-leave":
        summary = await executeEarnedLeaveAccrual(prisma);
        break;

      default:
        throw new Error(`Unknown cron job type: ${jobType}`);
    }

    const duration = new Date().getTime() - startTime;
    // Success = no failures AND (at least one success OR no users to process OR all skipped)
    // This handles cases like earned leave where all may be skipped (already accrued this month)
    const success =
      summary.failedCount === 0 &&
      (summary.successCount > 0 || summary.totalUsers === 0 || summary.skippedCount > 0);

    return {
      success,
      cronName: jobType,
      totalUsers: summary.totalUsers,
      successCount: summary.successCount,
      skippedCount: summary.skippedCount,
      failedCount: summary.failedCount,
      duration,
      message: `Total: ${summary.totalUsers}, Success: ${summary.successCount}, Skipped: ${summary.skippedCount}, Failed: ${summary.failedCount}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = new Date().getTime() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      cronName: jobType,
      totalUsers: 0,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      duration,
      message: `Execution failed: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validate CRON_SECRET header for API requests
 * Required for Vercel API routes to prevent unauthorized execution
 */
export function validateCronSecret(authHeader: string | null): boolean {
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.warn("[CRON] CRON_SECRET environment variable not set");
    return false;
  }

  return token === expectedSecret;
}

/**
 * Log cron execution to CronExecution table
 * Called by both Vercel and node-cron
 */
export async function logCronExecution(
  cronName: string,
  status: string,
  result: {
    totalUsers: number;
    successCount: number;
    skippedCount: number;
    failedCount: number;
    message?: string;
  }
): Promise<void> {
  try {
    await prisma.cronExecution.create({
      data: {
        cronName,
        status,
        totalUsers: result.totalUsers,
        successCount: result.successCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
        message: result.message,
        finishedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[CRON] Failed to log execution for ${cronName}:`, error);
  }
}
