import { NextRequest, NextResponse } from "next/server";
import { executeCronJob, validateCronSecret, logCronExecution } from "@/src/cron/executor";

/**
 * Auto Logout Cron Endpoint (Vercel)
 * 
 * Triggered by Vercel Cron: 29 18 * * * (11:59 PM IST = 6:29 PM UTC)
 * 
 * Headers required:
 * Authorization: Bearer <CRON_SECRET>
 * 
 * Response: JSON with execution summary
 */
export async function GET(request: NextRequest) {
  try {
    // Validate cron secret
    const authHeader = request.headers.get("authorization");
    if (!validateCronSecret(authHeader)) {
      console.warn("[CRON] Unauthorized cron request to auto-logout");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[CRON] Executing auto logout from Vercel");

    // Execute the cron job
    const result = await executeCronJob("auto-logout");

    // Log the execution
    await logCronExecution("AUTO_LOGOUT", result.success ? "SUCCESS" : "FAILED", {
      totalUsers: result.totalUsers,
      successCount: result.successCount,
      skippedCount: result.skippedCount,
      failedCount: result.failedCount,
      message: result.message,
    });

    return NextResponse.json(
      {
        success: result.success,
        cronName: result.cronName,
        totalUsers: result.totalUsers,
        successCount: result.successCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
        duration: `${result.duration}ms`,
        message: result.message,
        timestamp: result.timestamp,
      },
      { status: result.success ? 200 : 207 }
    );
  } catch (error) {
    console.error("[CRON] Error in auto-logout route:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
