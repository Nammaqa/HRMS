// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { executeEveningReminder } from "@/src/cron/logic/evening";
// import { logCronExecution } from "@/src/cron/executor";

// /**
//  * Evening Reminder Cron Endpoint (Vercel)
//  * 
//  * Triggered by Vercel Cron: 0 15 * * * (8:30 PM IST = 3:00 PM UTC)
//  * 
//  * Response: JSON with execution summary
//  */
// export async function GET(request: NextRequest) {
//   try {

//     console.log("[CRON] Executing evening reminder from Vercel");

//     const startTime = new Date();
//     const summary = await executeEveningReminder(prisma);
//     const result = {
//       success:
//         summary.failedCount === 0 &&
//         (summary.successCount > 0 || summary.totalUsers === 0 || summary.skippedCount > 0),
//       cronName: "evening-reminder",
//       totalUsers: summary.totalUsers,
//       successCount: summary.successCount,
//       skippedCount: summary.skippedCount,
//       failedCount: summary.failedCount,
//       duration: `${new Date().getTime() - startTime.getTime()}ms`,
//       message: `Total: ${summary.totalUsers}, Success: ${summary.successCount}, Skipped: ${summary.skippedCount}, Failed: ${summary.failedCount}`,
//       timestamp: new Date().toISOString(),
//     };

//     // Log the execution
//     await logCronExecution("EVENING_REMINDER", result.success ? "SUCCESS" : "FAILED", {
//       totalUsers: result.totalUsers,
//       successCount: result.successCount,
//       skippedCount: result.skippedCount,
//       failedCount: result.failedCount,
//       message: result.message,
//     });

//     return NextResponse.json(result, { status: result.success ? 200 : 207 });
//   } catch (error) {
//     console.error("[CRON] Error in evening-reminder route:", error);

//     return NextResponse.json(
//       {
//         error: "Internal server error",
//         message: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }
