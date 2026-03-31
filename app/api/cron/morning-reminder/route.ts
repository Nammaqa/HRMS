// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { executeMorningReminder } from "@/src/cron/logic/morning";
// import { logCronExecution } from "@/src/cron/executor";

// /**
//  * Morning Reminder Cron Endpoint (Vercel)
//  * 
//  * Triggered by Vercel Cron: 0 4 * * * (9:30 AM IST = 4:00 AM UTC)
//  * 
//  * Response: JSON with execution summary
//  */
// export async function GET(request: NextRequest) {
//   try {

//     console.log("[CRON] Executing morning reminder from Vercel");

//     const startTime = new Date();
//     const summary = await executeMorningReminder(prisma);
//     const result = {
//       success:
//         summary.failedCount === 0 &&
//         (summary.successCount > 0 || summary.totalUsers === 0 || summary.skippedCount > 0),
//       cronName: "morning-reminder",
//       totalUsers: summary.totalUsers,
//       successCount: summary.successCount,
//       skippedCount: summary.skippedCount,
//       failedCount: summary.failedCount,
//       duration: `${new Date().getTime() - startTime.getTime()}ms`,
//       message: `Total: ${summary.totalUsers}, Success: ${summary.successCount}, Skipped: ${summary.skippedCount}, Failed: ${summary.failedCount}`,
//       timestamp: new Date().toISOString(),
//     };

//     // Log the execution
//     await logCronExecution("MORNING_REMINDER", result.success ? "SUCCESS" : "FAILED", {
//       totalUsers: result.totalUsers,
//       successCount: result.successCount,
//       skippedCount: result.skippedCount,
//       failedCount: result.failedCount,
//       message: result.message,
//     });

//     return NextResponse.json(result, { status: result.success ? 200 : 207 });
//   } catch (error) {
//     console.error("[CRON] Error in morning-reminder route:", error);

//     return NextResponse.json(
//       {
//         error: "Internal server error",
//         message: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }
