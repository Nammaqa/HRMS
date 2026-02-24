import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

/**
 * GET /api/holidays
 * Fetch all holidays - accessible by everyone
 */
export async function GET(request: NextRequest) {
  try {
    const holidays = await prisma.holiday.findMany({
      select: {
        id: true,
        date: true,
        name: true,
        type: true,
        description: true,
      },
      orderBy: { date: "asc" },
    });

    // Format holidays for frontend
    const formattedHolidays = holidays.map((h) => ({
      id: h.id,
      name: h.name,
      date: h.date.toISOString().split("T")[0], // YYYY-MM-DD format
      type: h.type.toLowerCase() as "national" | "company" | "festival" | "optional",
      description: h.description || "",
    }));

    return NextResponse.json({
      success: true,
      data: formattedHolidays,
    });
  } catch (error) {
    console.error("Holidays fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch holidays" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/holidays
 * Add new holiday - admin only
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId, 10) },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can add holidays" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, date, type, description } = body;

    // Validate input
    if (!name || !date || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name, date, type" },
        { status: 400 }
      );
    }

    // Check if holiday already exists for that date
    const existingHoliday = await prisma.holiday.findUnique({
      where: { date: new Date(date) },
    });

    if (existingHoliday) {
      return NextResponse.json(
        { error: "Holiday already exists for this date" },
        { status: 400 }
      );
    }

    // Create holiday
    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: new Date(date),
        type: type.toUpperCase(),
        description: description || null,
        createdBy: parseInt(decoded.userId, 10).toString(),
      },
      select: {
        id: true,
        date: true,
        name: true,
        type: true,
        description: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: holiday.id,
          name: holiday.name,
          date: holiday.date.toISOString().split("T")[0],
          type: holiday.type.toLowerCase(),
          description: holiday.description || "",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Holiday creation error:", error);
    return NextResponse.json(
      { error: "Failed to create holiday" },
      { status: 500 }
    );
  }
}
