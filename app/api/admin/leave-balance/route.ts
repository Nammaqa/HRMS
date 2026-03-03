import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

// helper to ensure requester is an admin
async function checkAdmin(request: NextRequest): Promise<{ adminId: number } | NextResponse> {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 }
    );
  }

  const adminId =
    typeof payload.userId === "string"
      ? parseInt(payload.userId, 10)
      : payload.userId;

  if (isNaN(adminId) || adminId <= 0) {
    return NextResponse.json(
      { success: false, error: "Invalid user ID in token" },
      { status: 401 }
    );
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  });

  if (admin?.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 }
    );
  }

  return { adminId };
}

/**
 * GET /api/admin/leave-balance
 * Return all leave balances with user information. Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const check = await checkAdmin(request);
    if ((check as NextResponse)?.status) {
      // if checkAdmin returned a NextResponse (error), just return it
      return check as NextResponse;
    }

    const allBalances = await prisma.leaveBalance.findMany({
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    const formatted = allBalances.map((balance) => ({
      id: balance.id,
      userId: balance.userId,
      employeeName: balance.user
        ? `${balance.user.firstName || ""} ${balance.user.lastName || ""}`.trim()
        : "Unknown",
      sickLeave: balance.sickLeave,
      specialLeave: balance.specialLeave,
      bereavementLeave: balance.bereavementLeave,
      paternityLeave: balance.paternityLeave,
      earnedLeave: balance.earnedLeave,
      lossOfPayDays: balance.lossOfPayDays,
      compact: balance.compact,
      currentYear: balance.currentYear,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching admin leave balances:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/leave-balance
 * Update a leave balance record. Admin only.
 * Body must include userId and any of the leave fields to update.
 */
export async function PUT(request: NextRequest) {
  try {
    const check = await checkAdmin(request);
    if ((check as NextResponse)?.status) {
      return check as NextResponse;
    }

    const body = await request.json();
    const { userId } = body;

    if (typeof userId !== "number" || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Valid userId is required" },
        { status: 400 }
      );
    }

    const updatableFields = [
      "sickLeave",
      "specialLeave",
      "bereavementLeave",
      "paternityLeave",
      "earnedLeave",
      "lossOfPayDays",
      "compact",
      "currentYear",
    ];

    const updateData: any = {};
    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        const value = body[field];
        if (typeof value !== "number" || isNaN(value)) {
          return NextResponse.json(
            { success: false, error: `${field} must be a number` },
            { status: 400 }
          );
        }
        updateData[field] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updated = await prisma.leaveBalance.update({
      where: { userId },
      data: updateData,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating leave balance (admin):", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
