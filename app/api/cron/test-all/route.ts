import { NextRequest, NextResponse } from "next/server";
import { executeCronJob, logCronExecution } from "@/src/cron/executor";

/**
 * Test/Admin Endpoint: Trigger all crons at once
 * 
 * PURPOSE: Quick testing during development
 * WARNING: Remove or protect this endpoint in production!
 * 
 * Usage (dev only):
 * GET /api/cron/test-all
 * 
 * Returns results for all 4 crons with timing info
 */
export async function GET(request: NextRequest) {
  // Security: Optional - only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is disabled in production" },
      { status: 403 }
    );
  }

  try {
    console.log("[CRON-TEST] Starting all cron tests...");

    const results = [];
    
    // 1. Morning Reminder
    console.log("[CRON-TEST] Running morning reminder...");
    const morningResult = await executeCronJob("morning-reminder");
    await logCronExecution("MORNING_REMINDER", morningResult.success ? "SUCCESS" : "FAILED", {
      totalUsers: morningResult.totalUsers,
      successCount: morningResult.successCount,
      skippedCount: morningResult.skippedCount,
      failedCount: morningResult.failedCount,
      message: morningResult.message,
    });
    results.push({
      name: "morning-reminder",
      ...morningResult,
    });

    // 2. Evening Reminder
    console.log("[CRON-TEST] Running evening reminder...");
    const eveningResult = await executeCronJob("evening-reminder");
    await logCronExecution("EVENING_REMINDER", eveningResult.success ? "SUCCESS" : "FAILED", {
      totalUsers: eveningResult.totalUsers,
      successCount: eveningResult.successCount,
      skippedCount: eveningResult.skippedCount,
      failedCount: eveningResult.failedCount,
      message: eveningResult.message,
    });
    results.push({
      name: "evening-reminder",
      ...eveningResult,
    });

    // 3. Auto Logout
    console.log("[CRON-TEST] Running auto logout...");
    const autoLogoutResult = await executeCronJob("auto-logout");
    await logCronExecution("AUTO_LOGOUT", autoLogoutResult.success ? "SUCCESS" : "FAILED", {
      totalUsers: autoLogoutResult.totalUsers,
      successCount: autoLogoutResult.successCount,
      skippedCount: autoLogoutResult.skippedCount,
      failedCount: autoLogoutResult.failedCount,
      message: autoLogoutResult.message,
    });
    results.push({
      name: "auto-logout",
      ...autoLogoutResult,
    });

    // 4. Earned Leave Accrual
    console.log("[CRON-TEST] Running earned leave accrual...");
    const earnedLeaveResult = await executeCronJob("add-earned-leave");
    await logCronExecution("EARNED_LEAVE_ACCRUAL", earnedLeaveResult.success ? "SUCCESS" : "FAILED", {
      totalUsers: earnedLeaveResult.totalUsers,
      successCount: earnedLeaveResult.successCount,
      skippedCount: earnedLeaveResult.skippedCount,
      failedCount: earnedLeaveResult.failedCount,
      message: earnedLeaveResult.message,
    });
    results.push({
      name: "add-earned-leave",
      ...earnedLeaveResult,
    });

    // Summary
    const totalSuccess = results.filter(r => r.success).length;
    const totalProcessed = results.reduce((sum, r) => sum + r.totalUsers, 0);
    const totalSuccessCount = results.reduce((sum, r) => sum + r.successCount, 0);
    const totalFailedCount = results.reduce((sum, r) => sum + r.failedCount, 0);

    console.log("[CRON-TEST] All crons completed successfully");

    return NextResponse.json(
      {
        success: totalSuccess === 4,
        timestamp: new Date().toISOString(),
        summary: {
          cronsTested: results.length,
          cronsSuccessful: totalSuccess,
          totalUsersProcessed: totalProcessed,
          totalActionsSuccess: totalSuccessCount,
          totalActionsFailed: totalFailedCount,
        },
        results,
        note: "⚠️ This is a development/test endpoint. Remove or protect in production!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CRON-TEST] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
