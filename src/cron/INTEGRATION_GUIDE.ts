/**
 * INTEGRATION GUIDE: How to Enable Cron Jobs in Your App
 * 
 * This file explains exactly where to add cron initialization
 */

// ============================================================================
// FOR DIGITALOCEAN (Production with node-cron)
// ============================================================================

/**
 * OPTION 1: Add to src/app/layout.tsx (Root Layout)
 * 
 * File: src/app/layout.tsx
 * 
 * import type { Metadata } from "next";
 * import { initializeCronJobs } from "@/src/cron/listeners";
 * 
 * export const metadata: Metadata = {
 *   title: "Attendance System",
 *   description: "Employee attendance tracking",
 * };
 * 
 * let cronInitialized = false;
 * 
 * export default async function RootLayout({
 *   children,
 * }: {
 *   children: React.ReactNode;
 * }) {
 *   // Initialize cron jobs on first request (DigitalOcean production only)
 *   if (!cronInitialized && process.env.CRON_MODE === "node") {
 *     try {
 *       await initializeCronJobs();
 *       cronInitialized = true;
 *       console.log("[INIT] ✓ Cron jobs initialized");
 *     } catch (error) {
 *       console.error("[INIT] Failed to initialize cron jobs:", error);
 *       // Don't throw - app should continue even if cron fails
 *     }
 *   }
 * 
 *   return (
 *     <html lang="en" suppressHydrationWarning>
 *       <body className={inter.className}>
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 */

// ============================================================================
// OPTION 2: Add to src/app/api/init/route.ts (Initialization Endpoint)
// ============================================================================

/**
 * File: src/app/api/init/route.ts
 * 
 * import { NextResponse } from "next/server";
 * import { initializeCronJobs } from "@/src/cron/listeners";
 * 
 * let initialized = false;
 * 
 * export async function GET() {
 *   try {
 *     if (initialized) {
 *       return NextResponse.json({ status: "already initialized" });
 *     }
 * 
 *     if (process.env.CRON_MODE !== "node") {
 *       return NextResponse.json({
 *         status: "skipped",
 *         reason: "not in node mode",
 *       });
 *     }
 * 
 *     await initializeCronJobs();
 *     initialized = true;
 * 
 *     return NextResponse.json({
 *       status: "success",
 *       message: "Cron jobs initialized",
 *     });
 *   } catch (error) {
 *     return NextResponse.json(
 *       {
 *         status: "error",
 *         message: error instanceof Error ? error.message : "Unknown error",
 *       },
 *       { status: 500 }
 *     );
 *   }
 * }
 */

// ============================================================================
// OPTION 3: Add to PM2 Startup Script (DigitalOcean)
// ============================================================================

/**
 * File: scripts/pm2-start.js
 * 
 * const pm2 = require("pm2");
 * const path = require("path");
 * 
 * pm2.connect((err) => {
 *   if (err) {
 *     console.error(err);
 *     process.exit(2);
 *   }
 * 
 *   pm2.start({
 *     name: "attendance",
 *     script: "npm",
 *     args: "start",
 *     env: {
 *       NODE_ENV: "production",
 *       CRON_MODE: process.env.CRON_MODE || "node",
 *       IS_CRON_MASTER: process.env.IS_CRON_MASTER === "true" ? "true" : "false",
 *       CRON_SECRET: process.env.CRON_SECRET,
 *     },
 *     instances: 1,
 *     watch: false,
 *     max_memory_restart: "500M",
 *   }, (err, apps) => {
 *     pm2.disconnect();
 *     if (err) throw err;
 *   });
 * });
 * 
 * Then run: pm2 start scripts/pm2-start.js
 */

// ============================================================================
// FOR VERCEL (Testing/Staging)
// ============================================================================

/**
 * No initialization needed for Vercel!
 * 
 * The API routes in app/api/cron/* are automatically called by Vercel Cron.
 * Just ensure:
 * 
 * 1. vercel.json exists with cron configuration
 * 2. CRON_SECRET is set in Vercel Dashboard environment variables
 * 3. API routes validate the Authorization header
 * 
 * That's it! Vercel handles everything else.
 */

// ============================================================================
// ENVIRONMENT VARIABLES CHECKLIST
// ============================================================================

/**
 * Before running, ensure these are set:
 * 
 * DIGITALOCEAN (Production):
 *   export CRON_MODE=node
 *   export IS_CRON_MASTER=true
 *   export CRON_SECRET=your-secret-key
 *   export DATABASE_URL=postgresql://...
 *   export NODE_ENV=production
 * 
 * VERCEL (Testing):
 *   Set in Vercel Dashboard:
 *   - CRON_SECRET=your-secret-key
 *   - DATABASE_URL=postgresql://...
 * 
 *   vercel.json will handle the rest
 */

// ============================================================================
// VERIFICATION STEPS
// ============================================================================

/**
 * After enabling cron, verify:
 * 
 * 1. Check status endpoint:
 *    curl https://yourdomain.com/api/cron/status
 * 
 * 2. Check logs:
 *    DigitalOcean: pm2 logs attendance | grep CRON
 *    Vercel: Dashboard → Deployments → Logs
 * 
 * 3. Check database:
 *    SELECT * FROM "CronExecution" ORDER BY "startedAt" DESC LIMIT 5;
 * 
 * 4. Check notifications:
 *    SELECT * FROM "Notification" ORDER BY "createdAt" DESC LIMIT 10;
 * 
 * 5. Check audit log:
 *    SELECT * FROM "AuditLog" WHERE "action" LIKE '%REMINDER%' LIMIT 10;
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * If crons are not running:
 * 
 * 1. Check CRON_MODE and IS_CRON_MASTER are set:
 *    echo $CRON_MODE
 *    echo $IS_CRON_MASTER
 * 
 * 2. Check for errors in logs:
 *    pm2 logs | grep ERROR
 * 
 * 3. Verify database connection:
 *    npm run prisma:studio
 * 
 * 4. Check if migrations were run:
 *    npx prisma migrate status
 * 
 * 5. Manually test executor:
 *    node -e "require('./dist/src/cron/executor').executeCronJob('morning-reminder').then(r => console.log(r))"
 */

export {};
