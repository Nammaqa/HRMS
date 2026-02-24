import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

/**
 * GET /api/weekend-holiday-attendance
 * Fetches all weekend/holiday attendance records
 * Query params:
 * - status: PENDING, APPROVED, REJECTED
 * - userId: Filter by specific user
 * - limit: Number of records (default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === "string") {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userIdString = (decoded as any).userId || (decoded as any).id;
    const userId = parseInt(userIdString, 10);
    const userRole = (decoded as any).role;

    if (!userId || isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID in token. Please login again." },
        { status: 401 }
      );
    }

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "User ID not found in token" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const filterUserId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build filter conditions
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Only admin can see all, employees see only their own
    if (userRole !== "admin") {
      where.userId = userId;
    } else if (filterUserId) {
      where.userId = filterUserId;
    }

    const records = await prisma.weekendHolidayAttendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    const total = await prisma.weekendHolidayAttendance.count({ where });

    return NextResponse.json(
      {
        success: true,
        data: records,
        pagination: {
          total,
          limit,
          offset,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching weekend/holiday attendance:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
