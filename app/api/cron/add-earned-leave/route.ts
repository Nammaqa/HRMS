import { NextRequest, NextResponse } from "next/server";
import { executeCronJob, validateCronSecret, logCronExecution } from "@/src/cron/executor";

/**
 * Add Earned Leave Cron Endpoint (Vercel)
 * 
 * Triggered by Vercel Cron: 0 0 1 * * (12:00 AM IST on 1st of month = 6:30 PM UTC previous day)
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
      console.warn("[CRON] Unauthorized cron request to add-earned-leave");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[CRON] Executing earned leave accrual from Vercel");

    // Execute the cron job
    const result = await executeCronJob("add-earned-leave");

    // Log the execution
    await logCronExecution("EARNED_LEAVE_ACCRUAL", result.success ? "SUCCESS" : "FAILED", {
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
    console.error("[CRON] Error in add-earned-leave route:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
