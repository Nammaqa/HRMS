// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { executeEarnedLeaveAccrual } from "@/src/cron/logic/earnedLeave";
// import { logCronExecution } from "@/src/cron/executor";

// /**
//  * Add Earned Leave Cron Endpoint (Vercel)
//  * 
//  * Triggered by Vercel Cron: 0 0 1 * * (12:00 AM IST on 1st of month = 6:30 PM UTC previous day)
//  * 
//  * Response: JSON with execution summary
//  */
// export async function GET(request: NextRequest) {
//   try {

//     console.log("[CRON] Executing earned leave accrual from Vercel");

//     const startTime = new Date();
//     const summary = await executeEarnedLeaveAccrual(prisma);
//     const result = {
//       success:
//         summary.failedCount === 0 &&
//         (summary.successCount > 0 || summary.totalUsers === 0 || summary.skippedCount > 0),
//       cronName: "add-earned-leave",
//       totalUsers: summary.totalUsers,
//       successCount: summary.successCount,
//       skippedCount: summary.skippedCount,
//       failedCount: summary.failedCount,
//       duration: `${new Date().getTime() - startTime.getTime()}ms`,
//       message: `Total: ${summary.totalUsers}, Success: ${summary.successCount}, Skipped: ${summary.skippedCount}, Failed: ${summary.failedCount}`,
//       timestamp: new Date().toISOString(),
//     };

//     // Log the execution
//     await logCronExecution("EARNED_LEAVE_ACCRUAL", result.success ? "SUCCESS" : "FAILED", {
//       totalUsers: result.totalUsers,
//       successCount: result.successCount,
//       skippedCount: result.skippedCount,
//       failedCount: result.failedCount,
//       message: result.message,
//     });

//     return NextResponse.json(result, { status: result.success ? 200 : 207 });
//   } catch (error) {
//     console.error("[CRON] Error in add-earned-leave route:", error);

//     return NextResponse.json(
//       {
//         error: "Internal server error",
//         message: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }
