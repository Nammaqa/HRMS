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
      description,
      attachmentUrl,
    } = body;

    // Validate required fields
    if (!startDate || !endDate || !description) {
      return NextResponse.json(
        { error: "Missing required fields (from date, to date, reason)" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Normalize to date boundaries
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      return NextResponse.json(
        { error: "To date cannot be earlier than from date" },
        { status: 400 }
      );
    }

    // Check existing requests in range and avoid duplicates
    const existingRequests = await prisma.wFHRequest.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    if (existingRequests.length > 0) {
      return NextResponse.json(
        {
          error: "WFH request overlaps with existing WFH dates. Please choose a different range or cancel conflicting days.",
        },
        { status: 409 }
      );
    }

    const dateRange: Date[] = [];
    const iter = new Date(start);
    while (iter <= end) {
      dateRange.push(new Date(iter));
      iter.setDate(iter.getDate() + 1);
    }

    const createdWFH = await prisma.wFHRequest.createMany({
      data: dateRange.map((date) => ({
        userId,
        date,
        description,
        attachmentUrl: attachmentUrl || null,
        status: "PENDING",
      })),
      skipDuplicates: true,
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
        data: {
          startDate,
          endDate,
          totalDays: dateRange.length,
          insertedCount: createdWFH.count,
        },
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
      orderBy: { userId: "asc", date: "asc" }, // Order by user then date for grouping
    });

    // Group WFH requests by user and then by consecutive dates
    const groupWFHRequests = (requests: typeof wfhRequests) => {
      const userGroups: { [userId: number]: typeof requests } = {};
      
      // Group by user
      requests.forEach(req => {
        if (!userGroups[req.userId]) {
          userGroups[req.userId] = [];
        }
        userGroups[req.userId].push(req);
      });

      const grouped: any[] = [];

      Object.values(userGroups).forEach(userRequests => {
        if (userRequests.length === 0) return;

        const groups: typeof userRequests[] = [];
        let currentGroup = [userRequests[0]];

        for (let i = 1; i < userRequests.length; i++) {
          const prevDate = new Date(currentGroup[currentGroup.length - 1].date);
          const currDate = new Date(userRequests[i].date);
          const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

          // Check if consecutive, same status, and same description
          if (
            diffDays === 1 &&
            userRequests[i].status === currentGroup[0].status &&
            userRequests[i].description === currentGroup[0].description
          ) {
            currentGroup.push(userRequests[i]);
          } else {
            groups.push(currentGroup);
            currentGroup = [userRequests[i]];
          }
        }
        groups.push(currentGroup);

        groups.forEach(group => {
          grouped.push({
            id: group[0].id, // Use first request's ID
            employeeId: group[0].user.employeeId || group[0].user.id,
            employeeName: `${group[0].user.firstName} ${group[0].user.lastName}`.trim(),
            type: "wfh" as const,
            startDate: group[0].date.toISOString().split("T")[0],
            endDate: group[group.length - 1].date.toISOString().split("T")[0],
            reason: group[0].description,
            status: group[0].status.toLowerCase() as "pending" | "approved" | "rejected",
            createdAt: group[0].createdAt.toISOString().split("T")[0], // Use first request's createdAt
            attachmentUrl: group[0].attachmentUrl || undefined,
          });
        });
      });

      return grouped;
    };

    const formattedData = groupWFHRequests(wfhRequests);

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
