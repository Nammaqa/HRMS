import { NextRequest, NextResponse } from "next/server";
import { executeCronJob, validateCronSecret, logCronExecution } from "@/src/cron/executor";

/**
 * Evening Reminder Cron Endpoint (Vercel)
 * 
 * Triggered by Vercel Cron: 0 15 * * * (8:30 PM IST = 3:00 PM UTC)
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
      console.warn("[CRON] Unauthorized cron request to evening-reminder");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[CRON] Executing evening reminder from Vercel");

    // Execute the cron job
    const result = await executeCronJob("evening-reminder");

    // Log the execution
    await logCronExecution("EVENING_REMINDER", result.success ? "SUCCESS" : "FAILED", {
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
    console.error("[CRON] Error in evening-reminder route:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
