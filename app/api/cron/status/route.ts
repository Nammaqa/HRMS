import { NextRequest, NextResponse } from "next/server";
import { getCronJobStatus } from "@/src/cron/nodeCron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Cron Status Monitoring Endpoint
 * 
 * Returns health status of cron jobs
 * Useful for monitoring and debugging
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Validate admin access
    // const user = await getCurrentUser(request);
    // if (!user || user.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const cronStatus = getCronJobStatus();

    // Get recent executions
    const recentExecutions = await prisma.cronExecution.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    // Get execution stats for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await prisma.cronExecution.groupBy({
      by: ["cronName", "status"],
      where: {
        startedAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: true,
    });

    return NextResponse.json(
      {
        status: "ok",
        environment: {
          mode: process.env.CRON_MODE || "unknown",
          isMaster: process.env.IS_CRON_MASTER === "true",
          node: process.env.NODE_ENV,
        },
        cron: cronStatus,
        recentExecutions: recentExecutions.map((ex) => ({
          id: ex.id,
          cronName: ex.cronName,
          status: ex.status,
          startedAt: ex.startedAt.toISOString(),
          finishedAt: ex.finishedAt?.toISOString() || null,
          duration: ex.finishedAt
            ? Math.round(
                (ex.finishedAt.getTime() - ex.startedAt.getTime()) / 1000
              ) + "s"
            : "running",
          totalUsers: ex.totalUsers,
          successCount: ex.successCount,
          failedCount: ex.failedCount,
          message: ex.message,
        })),
        stats: {
          last7Days: stats,
          summary: {
            totalExecutions: stats.reduce((acc, s) => acc + s._count, 0),
            successfulExecutions: stats
              .filter((s) => s.status === "SUCCESS")
              .reduce((acc, s) => acc + s._count, 0),
            failedExecutions: stats
              .filter((s) => s.status === "FAILED")
              .reduce((acc, s) => acc + s._count, 0),
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CRON] Error fetching status:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch cron status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
