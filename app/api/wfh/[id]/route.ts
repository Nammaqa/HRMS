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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: typeof payload.userId === 'string' ? parseInt(payload.userId, 10) : payload.userId },
      select: { role: true },
    });

    if (admin?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, remarks } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // Update WFH request
    const wfhRequest = await prisma.wFHRequest.findUnique({
      where: { id: parseInt(id, 10) },
      include: { user: true },
    });

    if (!wfhRequest) {
      return NextResponse.json(
        { error: "WFH request not found" },
        { status: 404 }
      );
    }

    const updatedRequest = await prisma.wFHRequest.update({
      where: { id: parseInt(id, 10) },
      data: {
        status: status as "APPROVED" | "REJECTED",
        remarks,
      },
    });

    // Create notification for employee
    const statusText = status === "APPROVED" ? "approved" : "rejected";
    await prisma.notification.create({
      data: {
        userId: wfhRequest.userId,
        title: `WFH Application ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
        message: `Your WFH application has been ${statusText}`,
        type: status === "APPROVED" ? "SUCCESS" : "ALERT",
        icon: status === "APPROVED" ? "✅" : "❌",
      },
    });

    // If approved, create attendance record with WFH status
    if (status === "APPROVED") {
      const attendanceDate = new Date(wfhRequest.date);
      
      // Check if attendance record already exists
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: wfhRequest.userId,
            date: attendanceDate,
          },
        },
      });

      if (!existingAttendance) {
        await prisma.attendance.create({
          data: {
            userId: wfhRequest.userId,
            date: attendanceDate,
            loginTime: wfhRequest.inTime,
            logoutTime: wfhRequest.outTime,
            status: "WFH",
            shift: "NONE",
            isManual: true,
            remarks: `WFH approved: ${wfhRequest.description}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: `WFH request ${statusText} successfully`,
    });
  } catch (error) {
    console.error("Error updating WFH request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
