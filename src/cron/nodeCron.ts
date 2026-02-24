import cron, { ScheduledTask } from "node-cron";
import { PrismaClient } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";
import { executeMorningReminder } from "./logic/morning";
import { executeEveningReminder } from "./logic/evening";
import { executeAutoLogout } from "./logic/autoLogout";
import { executeEarnedLeaveAccrual } from "./logic/earnedLeave";

const prisma = new PrismaClient();

// Cron configuration
const TIMEZONE = "Asia/Kolkata";

interface CronJob {
  name: string;
  schedule: string;
  handler: (prisma: PrismaClient) => Promise<any>;
}

const jobs: CronJob[] = [
  {
    name: "MORNING_REMINDER",
    schedule: "30 9 * * 1-5", // 9:30 AM IST, Mon-Fri only
    handler: executeMorningReminder,
  },
  {
    name: "EVENING_REMINDER",
    schedule: "30 20 * * 1-5", // 8:30 PM IST, Mon-Fri only
    handler: executeEveningReminder,
  },
  {
    name: "AUTO_LOGOUT",
    schedule: "59 23 * * *", // 11:59 PM IST, every day
    handler: executeAutoLogout,
  },
  {
    name: "EARNED_LEAVE_ACCRUAL",
    schedule: "0 0 1 * *", // 12:00 AM IST on 1st of month
    handler: executeEarnedLeaveAccrual,
  },
];

let cronTasks: ScheduledTask[] = [];

/**
 * Initialize cron jobs
 * Should only be called once during application startup
 * Only initializes if:
 * - CRON_MODE === "node" (production environment)
 * - IS_CRON_MASTER === "true" (prevents duplicate execution on scaled instances)
 */
export async function initializeCronJobs(): Promise<void> {
  // Only run on production DigitalOcean
  if (
    process.env.CRON_MODE !== "node" ||
    process.env.IS_CRON_MASTER !== "true"
  ) {
    console.log("[CRON] Cron jobs disabled (not master instance)");
    return;
  }

  console.log("[CRON] Initializing cron jobs for DigitalOcean (node-cron)");

  for (const job of jobs) {
    try {
      // Log job initialization
      console.log(`[CRON] Scheduling ${job.name} at ${job.schedule} (${TIMEZONE})`);

      // Create and store the cron task
      const task = cron.schedule(
        job.schedule,
        async () => {
          const startTime = new Date();
          console.log(
            `[CRON] Starting ${job.name} at ${toZonedTime(startTime, TIMEZONE).toISOString()}`
          );

          try {
            // Create CronExecution record
            const execution = await prisma.cronExecution.create({
              data: {
                cronName: job.name,
                status: "STARTED",
              },
            });

            // Execute the cron job
            const result = await job.handler(prisma);

            // Update CronExecution record
            await prisma.cronExecution.update({
              where: { id: execution.id },
              data: {
                status:
                  result.failedCount === 0 &&
                  (result.successCount > 0 || result.totalUsers === 0)
                    ? "SUCCESS"
                    : result.successCount > 0
                      ? "PARTIAL_SUCCESS"
                      : "FAILED",
                finishedAt: new Date(),
                totalUsers: result.totalUsers,
                successCount: result.successCount,
                skippedCount: result.skippedCount,
                failedCount: result.failedCount,
                message: `Total: ${result.totalUsers}, Success: ${result.successCount}, Failed: ${result.failedCount}`,
              },
            });

            const endTime = new Date();
            const duration = (endTime.getTime() - startTime.getTime()) / 1000;

            console.log(
              `[CRON] Completed ${job.name} in ${duration.toFixed(2)}s - Success: ${result.successCount}/${result.totalUsers}, Failed: ${result.failedCount}`
            );
          } catch (error) {
            console.error(`[CRON] Error executing ${job.name}:`, error);
            
            // Try to log the failure
            try {
              await prisma.cronExecution.create({
                data: {
                  cronName: job.name,
                  status: "FAILED",
                  finishedAt: new Date(),
                  message: `Execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
              });
            } catch (logError) {
              console.error(`[CRON] Failed to log error for ${job.name}:`, logError);
            }
          }
        },
        {
          timezone: TIMEZONE,
        }
      );

      cronTasks.push(task);
      console.log(`[CRON] ✓ Scheduled ${job.name}`);
    } catch (error) {
      console.error(`[CRON] Failed to schedule ${job.name}:`, error);
    }
  }

  console.log(
    `[CRON] Cron jobs initialized. Timezone: ${TIMEZONE}. Running ${cronTasks.length} jobs.`
  );
}

/**
 * Stop all cron jobs gracefully
 * Call this during application shutdown
 */
export async function stopCronJobs(): Promise<void> {
  console.log("[CRON] Stopping all cron jobs...");

  for (const task of cronTasks) {
    task.stop();
  }

  cronTasks = [];
  console.log("[CRON] All cron jobs stopped");
}

/**
 * Get current status of cron jobs
 */
export function getCronJobStatus(): {
  enabled: boolean;
  timezone: string;
  jobCount: number;
  jobs: string[];
} {
  return {
    enabled:
      process.env.CRON_MODE === "node" &&
      process.env.IS_CRON_MASTER === "true",
    timezone: TIMEZONE,
    jobCount: cronTasks.length,
    jobs: jobs.map((j) => j.name),
  };
}
