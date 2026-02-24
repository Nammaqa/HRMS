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
 * GET /api/employee-dashboard/[id]
 * Fetches detailed employee dashboard for a specific user
 * Admin only: Can view any employee's dashboard
 * Employee: Can only view their own dashboard
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = decodeToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const currentUserId = parseInt(decoded.userId, 10);
    const parsedTargetUserId = parseInt(targetUserId, 10);

    // Check permission: Only admin or the user themselves can view
    if (currentUserId !== parsedTargetUserId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true },
      });

      if (currentUser?.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden: Cannot view other user's dashboard" },
          { status: 403 }
        );
      }
    }

    // Fetch user data
    const user = await prisma.user.findFirst({
      where: { id: parsedTargetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        currentAddress: true,
        profileImageUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch leave balance
    const leaveBalance = await prisma.leaveBalance.findUnique({
      where: { userId: parsedTargetUserId },
      select: {
        earnedLeave: true,
        sickLeave: true,
        specialLeave: true,
        lossOfPayDays: true,
      },
    });

    // Fetch all attendance records for the user
    const allAttendance = await prisma.attendance.findMany({
      where: { userId: parsedTargetUserId },
      select: {
        id: true,
        date: true,
        status: true,
        loginTime: true,
        logoutTime: true,
        remarks: true,
      },
      orderBy: { date: "desc" },
    });

    // Fetch all leave requests
    const allLeaveRequests = await prisma.leaveRequest.findMany({
      where: { userId: parsedTargetUserId },
      select: {
        id: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        reason: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all WFH requests
    const allWFHRequests = await prisma.wFHRequest.findMany({
      where: { userId: parsedTargetUserId },
      select: {
        id: true,
        date: true,
        inTime: true,
        outTime: true,
        description: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        user,
        leaveBalance: leaveBalance || {
          earnedLeave: 0,
          sickLeave: 0,
          casualLeave: 0,
          lossOfPay: 0,
        },
        attendance: allAttendance,
        leaveRequests: allLeaveRequests,
        wfhRequests: allWFHRequests,
      },
    });
  } catch (error) {
    console.error("Employee dashboard detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
