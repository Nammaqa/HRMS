import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Helper function to determine attendance status based on working hours
 * >= 8.5 hours: FULL_DAY
 * 4-8.5 hours: HALF_DAY (first or second based on login time)
 * < 4 hours: HALF_DAY_FIRST (removed NO_CREDIT concept)
 */
function determineAttendanceStatus(
  totalWorkingHours: number,
  loginTime: Date | null
): "FULL_DAY" | "HALF_DAY_FIRST" | "HALF_DAY_SECOND" {
  if (totalWorkingHours >= 8.5) {
    return "FULL_DAY";
  } else if (totalWorkingHours >= 4) {
    // Determine if first or second half based on login time
    if (loginTime) {
      const loginHour = loginTime.getHours();
      const loginMinute = loginTime.getMinutes();
      const loginTotalMinutes = loginHour * 60 + loginMinute;
      const halfDayBreak = 12.5 * 60; // 12:30 PM in minutes
      
      return loginTotalMinutes < halfDayBreak ? "HALF_DAY_FIRST" : "HALF_DAY_SECOND";
    }
    return "HALF_DAY_FIRST"; // Default to first half if no login time
  }
  return "HALF_DAY_FIRST"; // Default to HALF_DAY_FIRST for any hours worked (removed NO_CREDIT)
}

/**
 * GET /api/attendance/[id]
 * Fetches a specific attendance record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            designation: true,
            role: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance record" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/attendance/[id]
 * Updates an attendance record (admin override)
 * Supports editing both past and future attendance
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      loginTime,
      logoutTime,
      status,
      shift,
      remarks,
      loginLatitude,
      loginLongitude,
      logoutLatitude,
      logoutLongitude,
    } = body;

    // Check if attendance exists
    const attendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {
      isManual: true, // Mark as manually edited
    };

    if (status) {
      updateData.status = status;
    }

    if (shift) {
      updateData.shift = shift;
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    // Handle time fields
    let totalWorkingHours = null;
    let calculatedStatus = status; // Keep provided status as fallback
    
    if (loginTime || logoutTime) {
      const login = loginTime || attendance.loginTime;
      const logout = logoutTime || attendance.logoutTime;

      if (login && logout) {
        const loginDate = new Date(`2000-01-01T${typeof login === 'string' ? login : login.toTimeString().slice(0, 5)}`);
        const logoutDate = new Date(`2000-01-01T${typeof logout === 'string' ? logout : logout.toTimeString().slice(0, 5)}`);
        totalWorkingHours = (logoutDate.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

        if (loginTime) {
          updateData.loginTime = new Date(`2000-01-01T${loginTime}`);
        }
        if (logoutTime) {
          updateData.logoutTime = new Date(`2000-01-01T${logoutTime}`);
        }
        if (totalWorkingHours > 0) {
          updateData.totalWorkingHours = totalWorkingHours;
          // Auto-determine status if not explicitly provided
          if (!status) {
            calculatedStatus = determineAttendanceStatus(totalWorkingHours, loginDate);
          }
        }
      } else if (loginTime) {
        updateData.loginTime = new Date(`2000-01-01T${loginTime}`);
        updateData.logoutTime = null;
        updateData.totalWorkingHours = null;
      } else if (logoutTime) {
        updateData.logoutTime = new Date(`2000-01-01T${logoutTime}`);
        updateData.loginTime = null;
        updateData.totalWorkingHours = null;
      }
    }

    if (calculatedStatus) {
      updateData.status = calculatedStatus;
    }

    if (loginLatitude !== undefined) {
      updateData.loginLatitude = loginLatitude ? parseFloat(loginLatitude) : null;
    }

    if (loginLongitude !== undefined) {
      updateData.loginLongitude = loginLongitude ? parseFloat(loginLongitude) : null;
    }

    if (logoutLatitude !== undefined) {
      updateData.logoutLatitude = logoutLatitude ? parseFloat(logoutLatitude) : null;
    }

    if (logoutLongitude !== undefined) {
      updateData.logoutLongitude = logoutLongitude ? parseFloat(logoutLongitude) : null;
    }

    // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            designation: true,
          },
        },
      },
    });

    // TODO: Create audit log entry
    // await prisma.auditLog.create({
    //   data: {
    //     adminId: adminId, // Get from auth context
    //     action: "UPDATE_ATTENDANCE",
    //     entityType: "Attendance",
    //     entityId: id,
    //     description: `Updated attendance for ${updatedAttendance.user.name} on ${updatedAttendance.date.toDateString()}`,
    //   },
    // });

    return NextResponse.json(updatedAttendance);
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance record" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attendance/[id]
 * Deletes an attendance record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    await prisma.attendance.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(
      { message: "Attendance record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { error: "Failed to delete attendance record" },
      { status: 500 }
    );
  }
}
