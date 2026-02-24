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
 * DELETE /api/holidays/[id]
 * Delete holiday - admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId, 10) },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can delete holidays" },
        { status: 403 }
      );
    }

    // Delete holiday
    const deletedHoliday = await prisma.holiday.delete({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        name: true,
        date: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Holiday "${deletedHoliday.name}" deleted successfully`,
      data: {
        id: deletedHoliday.id,
        date: deletedHoliday.date.toISOString().split("T")[0],
      },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 }
      );
    }

    console.error("Holiday deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete holiday" },
      { status: 500 }
    );
  }
}
