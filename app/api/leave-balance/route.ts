import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Decode JWT manually
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
 * GET /api/leave-balance
 * Fetch current leave balance for authenticated user
 */
export async function GET(request: NextRequest) {
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

    const userId = typeof payload.userId === 'string' ? parseInt(payload.userId, 10) : payload.userId;

    // Validate userId - must be a valid number
    if (!userId || isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID in token. Please login again." },
        { status: 401 }
      );
    }

    // Get or create leave balance
    // Include user so we can inspect join date for first‑month logic
    let leaveBalance = await prisma.leaveBalance.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!leaveBalance) {
      // Create new balance for current year
      const currentYear = new Date().getFullYear();
      leaveBalance = await prisma.leaveBalance.create({
        // cast to any to avoid build-time type mismatches across environments
        data: {
          userId,
          currentYear,
          sickLeave: 5.0,
          specialLeave: 1.0,
          bereavementLeave: 5.0,
          paternityLeave: 5.0,
          earnedLeave: 0,
          lossOfPayDays: 0,
          compact: 0,
        } as any,
        include: { user: true },
      });
    }

    console.log("Leave balance fetched for user:", userId, leaveBalance);

    // Auto-accrue monthly earned leave on first fetch for the month
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const lastAccrual = leaveBalance.lastAccrualDate
        ? new Date(leaveBalance.lastAccrualDate)
        : null;

      let needsAccrual =
        !lastAccrual ||
        lastAccrual.getMonth() !== currentMonth ||
        lastAccrual.getFullYear() !== currentYear;

      // if this would be the *first* accrual and the user just joined this month,
      // defer until next month.
      if (
        needsAccrual &&
        !lastAccrual &&
        leaveBalance.user?.dateOfJoining
      ) {
        const doj = new Date(leaveBalance.user.dateOfJoining);
        if (
          doj.getMonth() === currentMonth &&
          doj.getFullYear() === currentYear
        ) {
          needsAccrual = false;
        }
      }

      if (needsAccrual) {
        // increment by 1.25 EL and update lastAccrualDate
        leaveBalance = await prisma.leaveBalance.update({
          where: { userId },
          data: {
            earnedLeave: { increment: 1.25 },
            lastAccrualDate: now,
          },
          include: { user: true },
        });
      }
    } catch (e) {
      // Don't fail the whole request if accrual fails; log and continue
      console.error("Auto-accrual failed:", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        earnedLeave: leaveBalance.earnedLeave,
        sickLeave: leaveBalance.sickLeave,
        specialLeave: leaveBalance.specialLeave,
        bereavementLeave: leaveBalance.bereavementLeave !== undefined ? leaveBalance.bereavementLeave : 5.0,
        paternityLeave: leaveBalance.paternityLeave !== undefined ? leaveBalance.paternityLeave : 5.0,
        lossOfPayDays: leaveBalance.lossOfPayDays,
        compact: leaveBalance.compact || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching leave balance:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leave-balance/accrue
 * Monthly accrual: Add 1.25 EL unconditionally every month
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

    const userId = typeof payload.userId === 'string' ? parseInt(payload.userId, 10) : payload.userId;

    // Validate userId - must be a valid number
    if (!userId || isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID in token. Please login again." },
        { status: 401 }
      );
    }

    // Get current leave balance
    // also pull the user for join-date logic
    let leaveBalance = await prisma.leaveBalance.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!leaveBalance) {
      const currentYear = new Date().getFullYear();
      leaveBalance = await prisma.leaveBalance.create({
        data: {
          userId,
          currentYear,
          sickLeave: 5.0,
          specialLeave: 1.0,
          bereavementLeave: 5.0,
          paternityLeave: 5.0,
        } as any,
        include: { user: true },
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Check if last accrual was in a different month
    const lastAccrual = leaveBalance.lastAccrualDate
      ? new Date(leaveBalance.lastAccrualDate)
      : null;

    let needsAccrual =
      !lastAccrual ||
      lastAccrual.getMonth() !== currentMonth ||
      lastAccrual.getFullYear() !== currentYear;

    if (
      needsAccrual &&
      !lastAccrual &&
      leaveBalance.user?.dateOfJoining
    ) {
      const doj = new Date(leaveBalance.user.dateOfJoining);
      if (
        doj.getMonth() === currentMonth &&
        doj.getFullYear() === currentYear
      ) {
        needsAccrual = false;
      }
    }

    if (!needsAccrual) {
      return NextResponse.json({
        success: true,
        message: "Already accrued for this month",
        data: leaveBalance,
      });
    }

    // Add 1.25 EL every month automatically (unconditional accrual)
    const updatedBalance = await prisma.leaveBalance.update({
      where: { userId },
      data: {
        earnedLeave: {
          increment: 1.25,
        },
        lastAccrualDate: now,
      },
      include: { user: true },
    });

    return NextResponse.json({
      success: true,
      message: "Monthly accrual applied: +1.25 earned leave",
      data: updatedBalance,
    });
  } catch (error) {
    console.error("Error processing accrual:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
