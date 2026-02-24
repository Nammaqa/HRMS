import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Decode JWT manually without using jsonwebtoken (which doesn't work in Edge Runtime)
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

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Decode JWT
    const payload = decodeToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
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

    // Get request body
    const body = await request.json();
    const {
      startDate,
      endDate,
      inTime,
      outTime,
      description,
      attachmentUrl,
    } = body;

    // Validate required fields
    if (!startDate || !endDate || !inTime || !outTime || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create WFH request
    const wfhRequest = await prisma.wFHRequest.create({
      data: {
        userId,
        date: new Date(startDate),
        inTime: new Date(`${startDate}T${inTime}`),
        outTime: new Date(`${endDate}T${outTime}`),
        description,
        attachmentUrl: attachmentUrl || null,
        status: "PENDING",
      },
    });

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
    });

    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const employeeName = `${employee?.firstName} ${employee?.lastName}`.trim();

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "New WFH Application",
          message: `${employeeName} has applied for Work From Home from ${startDate} to ${endDate}`,
          type: "ALERT",
          icon: "📋",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: wfhRequest,
        message: "WFH request submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating WFH request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = decodeToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: typeof payload.userId === 'string' ? parseInt(payload.userId, 10) : payload.userId },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all WFH requests with employee details
    const wfhRequests = await prisma.wFHRequest.findMany({
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

    const formattedData = wfhRequests.map((req) => ({
      id: req.id,
      employeeId: req.user.employeeId || req.user.id,
      employeeName: `${req.user.firstName} ${req.user.lastName}`.trim(),
      type: "wfh" as const,
      startDate: req.date.toISOString().split("T")[0],
      endDate: req.date.toISOString().split("T")[0],
      inTime: req.inTime?.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      outTime: req.outTime?.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      reason: req.description,
      status: req.status.toLowerCase() as "pending" | "approved" | "rejected",
      createdAt: req.createdAt.toISOString().split("T")[0],
      attachmentUrl: req.attachmentUrl || undefined,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching WFH requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
