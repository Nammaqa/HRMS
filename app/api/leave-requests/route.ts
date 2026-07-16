import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeaveType } from "@prisma/client";

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
 * POST /api/leave-requests
 * Create a new leave request
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
    
    const activeUser = await prisma.user.findFirst({
      where: { id: Number(userId), employeeStatus: "ACTIVE" },
      select: { id: true },
    });
    if (!activeUser) {
      return NextResponse.json(
        { success: false, error: "Your account is inactive. Please contact HR.", code: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }
    const body = await request.json();

    const { leaveType, startDate, endDate, reason, totalDays, attachmentUrl } = body;

    console.log("Leave request received:", { leaveType, totalDays, userId });

    if (!leaveType || !startDate || !endDate || !reason || !totalDays) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate leave type
    const validLeaveTypes: LeaveType[] = ["EARNED", "SICK", "SPECIAL", "BEREAVEMENT", "PATERNITY", "ELECTION", "COMPACT", "LOSS_OF_PAY"];
    let upperLeaveType = leaveType.toUpperCase();
    
    // Handle 'LOP' -> 'LOSS_OF_PAY' conversion
    if (upperLeaveType === "LOP") {
      upperLeaveType = "LOSS_OF_PAY";
    }
    
    console.log("Leave type validation:", { originalLeaveType: leaveType, upperLeaveType, isValid: validLeaveTypes.includes(upperLeaveType as LeaveType) });
    
    if (!validLeaveTypes.includes(upperLeaveType as LeaveType)) {
      return NextResponse.json(
        { success: false, error: "Invalid leave type" },
        { status: 400 }
      );
    }

    const typedLeaveType = upperLeaveType as LeaveType;

    // Get user's leave balance
    let leaveBalance = await prisma.leaveBalance.findUnique({
      where: { userId },
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
        },
      });
    }

    const requestedDays = parseInt(totalDays);

    // Validate balance based on leave type
    if (typedLeaveType === "EARNED") {
      if (leaveBalance.earnedLeave < requestedDays) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient Earned Leave. Available: ${leaveBalance.earnedLeave}, Requested: ${requestedDays}`,
          },
          { status: 400 }
        );
      }
    } else if (typedLeaveType === "SICK") {
      if (leaveBalance.sickLeave < requestedDays) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient Sick Leave. Available: ${leaveBalance.sickLeave}, Requested: ${requestedDays}`,
          },
          { status: 400 }
        );
      }
    } else if (typedLeaveType === "SPECIAL") {
      // Special Leave: allowed only when selected date range includes
      // user's dateOfBirth or dateOfMarriage (matching day and month)
      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { dateOfBirth: true, dateOfMarriage: true },
      });

      const start = new Date(startDate);
      const end = new Date(endDate);

      const hasMatchingSpecialDate = (() => {
        if (!userRecord) return false;
        const dob = userRecord.dateOfBirth ? new Date(userRecord.dateOfBirth) : null;
        const dom = userRecord.dateOfMarriage ? new Date(userRecord.dateOfMarriage) : null;
        if (!dob && !dom) return false;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const day = d.getDate();
          const month = d.getMonth();
          if (dob && dob.getDate() === day && dob.getMonth() === month) return true;
          if (dom && dom.getDate() === day && dom.getMonth() === month) return true;
        }
        return false;
      })();

      if (!hasMatchingSpecialDate) {
        return NextResponse.json(
          { success: false, error: "Selected date is not your dateOfBirth or dateOfMarriage" },
          { status: 400 }
        );
      }

      if (leaveBalance.specialLeave < requestedDays) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient Special Leave. Available: ${leaveBalance.specialLeave}, Requested: ${requestedDays}`,
          },
          { status: 400 }
        );
      }
    } else if (typedLeaveType === "BEREAVEMENT") {
      // Bereavement Leave - Check balance (5 days per year)
      if ((leaveBalance.bereavementLeave || 0) < requestedDays) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient Bereavement Leave. Available: ${leaveBalance.bereavementLeave || 0}, Requested: ${requestedDays}`,
          },
          { status: 400 }
        );
      }
    } else if (typedLeaveType === "PATERNITY") {
      // Paternity Leave - Check balance (5 days per year)
      if ((leaveBalance.paternityLeave || 0) < requestedDays) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient Paternity Leave. Available: ${leaveBalance.paternityLeave || 0}, Requested: ${requestedDays}`,
          },
          { status: 400 }
        );
      }
    } else if (typedLeaveType === "COMPACT") {
      // Comp Off - Check balance (earned for weekend/holiday work)
      const compOffBalance = leaveBalance.compact || 0;
      if (compOffBalance < requestedDays) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient Comp Off. Available: ${compOffBalance}, Requested: ${requestedDays}. Comp Off is earned when you work on weekends or holidays.`,
          },
          { status: 400 }
        );
      }
    } else if (typedLeaveType === "LOSS_OF_PAY") {
      // LOP is always allowed; do not require any other leave balances to be exhausted.
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveType: typedLeaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays: requestedDays,
        reason,
        status: "PENDING",
        attachmentUrl: attachmentUrl || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Leave request submitted successfully",
        data: leaveRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leave-requests
 * Fetch all leave requests (admin)
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: typeof payload.userId === 'string' ? parseInt(payload.userId, 10) : payload.userId },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all leave requests
    const leaveRequests = await prisma.leaveRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedData = leaveRequests.map((req) => ({
      id: String(req.id),
      employeeId: req.user.employeeId || String(req.user.id),
      employeeName: `${req.user.firstName} ${req.user.lastName}`.trim(),
      type: "leave" as const,
      startDate: req.startDate.toISOString().split("T")[0],
      endDate: req.endDate.toISOString().split("T")[0],
      leaveType: req.leaveType,
      totalDays: req.totalDays,
      reason: req.reason || "",
      status: req.status.toLowerCase() as "pending" | "approved" | "rejected",
      createdAt: req.createdAt.toISOString().split("T")[0],
      attachmentUrl: req.attachmentUrl || undefined,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
