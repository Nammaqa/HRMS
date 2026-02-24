/**
 * Cron Initialization and Lifecycle Management
 * 
 * This file shows how to integrate cron jobs with your Next.js application
 * in src/app/layout.tsx or a server-side initialization endpoint
 */

import { initializeCronJobs, stopCronJobs } from "@/src/cron/nodeCron";
import { getCronJobStatus } from "@/src/cron/nodeCron";

/**
 * INTEGRATION GUIDE
 * 
 * 1) ADD TO src/app/layout.tsx (Root Layout Server Component):
 * 
 * ```typescript
 * import { initializeCronJobs } from '@/src/cron/listeners';
 * 
 * export default async function RootLayout({
 *   children,
 * }: {
 *   children: React.ReactNode;
 * }) {
 *   // Initialize cron jobs on server startup (production only)
 *   try {
 *     await initializeCronJobs();
 *   } catch (error) {
 *     console.error('Failed to initialize cron jobs:', error);
 *   }
 * 
 *   return (
 *     <html lang="en">
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 * 
 * 2) OR CREATE A SEPARATE API ROUTE FOR INITIALIZATION:
 * 
 * See: src/app/api/cron/status/route.ts
 * 
 * 3) OR USE A GRACEFUL SHUTDOWN HANDLER:
 * 
 * When your DigitalOcean server shuts down, ensure cron jobs are stopped
 */

/**
 * Initialize cron jobs for DigitalOcean production
 * 
 * Call this once during application startup
 * Only initializes if:
 * - CRON_MODE === "node"
 * - IS_CRON_MASTER === "true"
 */
export async function initializeCrons(): Promise<void> {
  try {
    console.log("[CRON] Initializing cron system...");
    await initializeCronJobs();
    console.log("[CRON] ✓ Cron system initialized successfully");
  } catch (error) {
    console.error("[CRON] Failed to initialize cron system:", error);
    throw error;
  }
}

/**
 * Stop all cron jobs gracefully
 * 
 * Call this during application shutdown
 */
export async function stopCrons(): Promise<void> {
  try {
    console.log("[CRON] Stopping cron system...");
    await stopCronJobs();
    console.log("[CRON] ✓ Cron system stopped");
  } catch (error) {
    console.error("[CRON] Error stopping cron system:", error);
  }
}

/**
 * Get current cron status for monitoring/debugging
 */
export function getCronStatus(): {
  enabled: boolean;
  timezone: string;
  jobCount: number;
  jobs: string[];
} {
  return getCronJobStatus();
}

/**
 * ENVIRONMENT VARIABLES REQUIRED
 * 
 * Add to your .env.local or .env.production:
 * 
 * # Cron Configuration
 * CRON_MODE="node"                    # "node" for DigitalOcean, "vercel" for Vercel
 * IS_CRON_MASTER="true"               # "true" to enable cron on this instance
 * CRON_SECRET="your-secret-key-here"  # For Vercel API authentication
 * 
 * On DigitalOcean (one instance):
 * CRON_MODE=node
 * IS_CRON_MASTER=true
 * CRON_SECRET=your-secret-key
 * 
 * On scaled DigitalOcean (multiple instances):
 * - Only ONE instance should have IS_CRON_MASTER=true
 * - Others should have IS_CRON_MASTER=false
 * - Or use a load balancer to route cron to primary instance
 * 
 * On Vercel (testing):
 * CRON_MODE=vercel
 * CRON_SECRET=your-secret-key
 */

/**
 * MONITORING AND DEBUGGING
 * 
 * 1) Check CronExecution table:
 * ```sql
 * SELECT * FROM "CronExecution" 
 * ORDER BY "startedAt" DESC 
 * LIMIT 20;
 * ```
 * 
 * 2) Monitor Vercel cron:
 * - Go to: https://vercel.com/dashboard/project/[project]/settings/crons
 * 
 * 3) Check DigitalOcean node-cron in logs:
 * - SSH into server: ssh root@[server-ip]
 * - Check application logs: pm2 logs attendance
 * 
 * 4) Test API route manually:
 * ```bash
 * curl -H "Authorization: Bearer your-cron-secret" \
 *   https://yourdomain.com/api/cron/morning-reminder
 * ```
 * 
 * 5) Check AuditLog for actions:
 * ```sql
 * SELECT * FROM "AuditLog" 
 * WHERE "action" LIKE '%REMINDER%' OR "action" = 'AUTO_LOGOUT'
 * ORDER BY "createdAt" DESC;
 * ```
 */
