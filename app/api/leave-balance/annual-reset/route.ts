import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function decodeToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    );
    return decoded;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

/**
 * POST /api/leave-balance/annual-reset
 * Admin only: Trigger annual reset on January 1
 * 
 * Logic:
 * - Carry forward earned leave (MAX 10 days)
 * - Reset sick leave to 5 days
 * - Reset special leave to 1 day
 * - Reset comp-off (compact) to 0 days
 * - Update current year
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = decodeToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: typeof payload.userId === 'string' ? parseInt(payload.userId, 10) : payload.userId },
      select: { role: true },
    });

    if (admin?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // Get all employee leave balances
    const allBalances = await prisma.leaveBalance.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    let resetCount = 0;
    const resetDetails: any[] = [];

    // Process each employee
    for (const balance of allBalances) {
      // Calculate carry forward (MAX 10 days from earned leave)
      const carryForward = Math.min(balance.earnedLeave, 10);

      // Update balance for new year
      const updatedBalance = await prisma.leaveBalance.update({
        where: { userId: balance.userId },
        data: {
          earnedLeave: carryForward, // Start with carry forward (max 10)
          sickLeave: 5.0, // Reset to 5
          specialLeave: 1.0, // Reset to 1
          compact: 0, // Reset comp-off to 0
          currentYear, // Update year
          lastAccrualDate: null, // Reset accrual date to allow January accrual
        },
      });

      resetCount++;
      resetDetails.push({
        userId: balance.user.id,
        name: balance.user.name,
        email: balance.user.email,
        previousEarned: balance.earnedLeave,
        carriedForward: carryForward,
        carriedForwardCapped: carryForward > 10, // True if it was capped at 10
      });

      // Create notification for employee
      await prisma.notification.create({
        data: {
          userId: balance.userId,
          title: "Annual Leave Reset",
          message: `Annual leave reset for ${currentYear}. Carried forward: ${carryForward} days (max 10). Sick leave: 5 days, Special leave: 1 day.`,
          type: "INFO",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Annual leave reset completed for ${resetCount} employees. All balances reset for ${currentYear}.`,
      data: {
        totalEmployees: resetCount,
        timestamp: now,
        details: resetDetails,
      },
    });
  } catch (error) {
    console.error("Error in annual reset:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
