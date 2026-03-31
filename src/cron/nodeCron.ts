// import cron, { ScheduledTask } from "node-cron";
// import { PrismaClient } from "@prisma/client";
// import { toZonedTime } from "date-fns-tz";

// const prisma = new PrismaClient();

// // Cron configuration
// const TIMEZONE = "Asia/Kolkata";
// // Base URL used by node-cron to call cron API endpoints.
// // Override with CRON_BASE_URL if localhost is not reachable.
// const BASE_URL = (process.env.CRON_BASE_URL || process.env.CRON_TARGET_URL || `http://127.0.0.1:${process.env.PORT || "3000"}`).replace(/\/$/, "");

// interface CronJob {
//   name: string;
//   schedule: string;
//   endpoint: string;
// }

// const jobs: CronJob[] = [
//   {
//     name: "MORNING_REMINDER",
//     schedule: "30 9 * * 1-5", // 9:30 AM IST, Mon-Fri only
//     endpoint: "/api/cron/morning-reminder",
//   },
//   {
//     name: "EVENING_REMINDER",
//     schedule: "30 20 * * 1-5", // 8:30 PM IST, Mon-Fri only
//     endpoint: "/api/cron/evening-reminder",
//   },
//   {
//     name: "AUTO_LOGOUT",
//     schedule: "59 23 * * *", // 11:59 PM IST, every day
//     endpoint: "/api/cron/auto-logout",
//   },
//   {
//     name: "EARNED_LEAVE_ACCRUAL",
//     schedule: "0 0 1 * *", // 12:00 AM IST on 1st of month
//     endpoint: "/api/cron/add-earned-leave",
//   },
// ];

// let cronTasks: ScheduledTask[] = [];

// function getEndpointUrl(endpoint: string) {
//   return `${BASE_URL}${endpoint}`;
// }

// function parseCronResult(json: any) {
//   return {
//     totalUsers: typeof json?.totalUsers === "number" ? json.totalUsers : 0,
//     successCount: typeof json?.successCount === "number" ? json.successCount : 0,
//     skippedCount: typeof json?.skippedCount === "number" ? json.skippedCount : 0,
//     failedCount: typeof json?.failedCount === "number" ? json.failedCount : 0,
//     message: typeof json?.message === "string" ? json.message : JSON.stringify(json) || "No message",
//   };
// }

// async function executeCronEndpoint(job: CronJob) {
//   const url = getEndpointUrl(job.endpoint);
//   const startTime = new Date();

//   console.log(
//     `[CRON] Starting ${job.name} at ${toZonedTime(startTime, TIMEZONE).toISOString()} (calling ${url})`
//   );

//   const execution = await prisma.cronExecution.create({
//     data: {
//       cronName: job.name,
//       status: "STARTED",
//     },
//   });

//   try {
//     const response = await fetch(url, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     const responseBody = await response.json().catch(() => ({}));
//     const parsed = parseCronResult(responseBody);
//     const success = response.ok && responseBody?.success !== false;
//     const status = success ? "SUCCESS" : "FAILED";

//     await prisma.cronExecution.update({
//       where: { id: execution.id },
//       data: {
//         status,
//         finishedAt: new Date(),
//         totalUsers: parsed.totalUsers,
//         successCount: parsed.successCount,
//         skippedCount: parsed.skippedCount,
//         failedCount: parsed.failedCount,
//         message: parsed.message,
//       },
//     });

//     const endTime = new Date();
//     const duration = (endTime.getTime() - startTime.getTime()) / 1000;
//     console.log(
//       `[CRON] Completed ${job.name} in ${duration.toFixed(2)}s - status=${status} response=${response.status}`
//     );
//   } catch (error) {
//     console.error(`[CRON] Error executing ${job.name}:`, error);
//     await prisma.cronExecution.update({
//       where: { id: execution.id },
//       data: {
//         status: "FAILED",
//         finishedAt: new Date(),
//         message: `Execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
//       },
//     });
//   }
// }

// /**
//  * Initialize cron jobs
//  * Should only be called once during application startup
//  * Only initializes if:
//  * - CRON_MODE === "node" (production mode for node-cron)
//  * - IS_CRON_MASTER === "true" (prevents duplicate execution on scaled instances)
//  */
// export async function initializeCronJobs(): Promise<void> {
//   if (
//     process.env.CRON_MODE !== "node" ||
//     process.env.IS_CRON_MASTER !== "true"
//   ) {
//     console.log("[CRON] Cron jobs disabled (not master instance or not node mode)");
//     return;
//   }

//   console.log("[CRON] Initializing cron jobs for node-cron");

//   for (const job of jobs) {
//     try {
//       console.log(`[CRON] Scheduling ${job.name} at ${job.schedule} (${TIMEZONE})`);

//       const task = cron.schedule(
//         job.schedule,
//         async () => {
//           try {
//             await executeCronEndpoint(job);
//           } catch (error) {
//             console.error(`[CRON] Unhandled error in ${job.name}:`, error);
//           }
//         },
//         {
//           timezone: TIMEZONE,
//         }
//       );

//       cronTasks.push(task);
//       console.log(`[CRON] ✓ Scheduled ${job.name}`);
//     } catch (error) {
//       console.error(`[CRON] Failed to schedule ${job.name}:`, error);
//     }
//   }

//   console.log(
//     `[CRON] Cron jobs initialized. Timezone: ${TIMEZONE}. Running ${cronTasks.length} jobs.`
//   );
// }

// /**
//  * Stop all cron jobs gracefully
//  * Call this during application shutdown
//  */
// export async function stopCronJobs(): Promise<void> {
//   console.log("[CRON] Stopping all cron jobs...");

//   for (const task of cronTasks) {
//     task.stop();
//   }

//   cronTasks = [];
//   console.log("[CRON] All cron jobs stopped");
// }

// /**
//  * Get current status of cron jobs
//  */
// export function getCronJobStatus(): {
//   enabled: boolean;
//   timezone: string;
//   jobCount: number;
//   jobs: string[];
// } {
//   return {
//     enabled:
//       process.env.CRON_MODE === "node" &&
//       process.env.IS_CRON_MASTER === "true",
//     timezone: TIMEZONE,
//     jobCount: cronTasks.length,
//     jobs: jobs.map((j) => j.name),
//   };
// }
