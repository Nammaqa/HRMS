import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function decodeToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    return decoded;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

/**
 * POST /api/leave-balance/accrue-all
 * Admin only: Trigger monthly accrual for all employees
 * 
 * Monthly accrual: +1.25 EL unconditionally (max 30 days cap)
 * Annual reset (Jan 1): Carry forward max 10 days, reset sick/special/compact
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
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const isJanuary1 = currentMonth === 0; // January is month 0

    // Get all leave balances (unconditional accrual - no condition)
    const balancesToAccrue = await prisma.leaveBalance.findMany();

    let accrued = 0;
    let skipped = 0;
    let resetCount = 0;

    // Process each balance
    for (const balance of balancesToAccrue) {
      const lastAccrual = balance.lastAccrualDate
        ? new Date(balance.lastAccrualDate)
        : null;

      const needsAccrual =
        !lastAccrual ||
        lastAccrual.getMonth() !== currentMonth ||
        lastAccrual.getFullYear() !== currentYear;

      if (needsAccrual) {
        if (isJanuary1) {
          // Annual reset on January 1
          const carryForward = Math.min(balance.earnedLeave, 10); // Max 10 days carry

          await prisma.leaveBalance.update({
            where: { userId: balance.userId },
            data: {
              earnedLeave: carryForward, // Start with carry forward (max 10)
              sickLeave: 5.0, // Reset to 5
              specialLeave: 1.0, // Reset to 1
              compact: 0, // Reset comp-off to 0
              currentYear, // Update year
              lastAccrualDate: now,
            },
          });
          resetCount++;
        } else {
          // Regular monthly accrual: +1.25 EL (capped at 30)
          const newBalance = Math.min(balance.earnedLeave + 1.25, 30);
          
          await prisma.leaveBalance.update({
            where: { userId: balance.userId },
            data: {
              earnedLeave: newBalance,
              lastAccrualDate: now,
            },
          });
          accrued++;
        }
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: isJanuary1 
        ? `Annual reset completed for ${resetCount} employees. Carry forward: max 10 days, Sick: 5 days, Special: 1 day, Comp-off: 0 days`
        : `Monthly accrual completed - all employees received +1.25 earned leave (capped at 30 days max)`,
      data: {
        totalProcessed: balancesToAccrue.length,
        accrued,
        skipped,
        resetCount: isJanuary1 ? resetCount : 0,
        timestamp: now,
      },
    });
  } catch (error) {
    console.error("Error processing accrual for all users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
