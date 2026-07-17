import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const getDisplayName = (user: { name?: string | null; firstName?: string | null; middleName?: string | null; lastName?: string | null }) => {
  const parts = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return user.name?.trim() || "User";
};

// Decode JWT manually without using jsonwebtoken (which doesn't work in Edge Runtime)
function decodeToken(token: string): { userId: number | string; email: string; role: string } | null {
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

    const userId = typeof payload.userId === "string" ? parseInt(payload.userId, 10) : payload.userId;
    if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
      return NextResponse.json(
        { error: "Invalid user ID in token. Please login again." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: Number(userId) },
      select: {
        // Basic Info
        id: true,
        name: true,
        email: true,
        role: true,
        employeeStatus: true,
        
        // Personal Information
        firstName: true,
        middleName: true,
        lastName: true,
        profileImageUrl: true,
        phone: true,
        alternateContact: true,
        emergencyContact: true,
        personalEmail: true,
        
        // Details
        designation: true,
        designationAtCompany: true,
        bloodGroup: true,
        gender: true,
        maritalStatus: true,
        dateOfMarriage: true,
        fatherName: true,
        motherName: true,
        location: true,
        dateOfBirth: true,
        citizenship: true,
        
        // Address
        currentAddress: true,
        permanentAddress: true,
        
        // Company
        employeeId: true,
        projectClient: true,
        dateOfJoining: true,
        dateOfDeployment: true,
        totalExperience: true,
        dateOfExit: true,
        
        // Education
        masterDegree: true,
        masterYOP: true,
        masterPercentage: true,
        secondaryDegree: true,
        secondaryYOP: true,
        secondaryPercentage: true,
        twelfthDegree: true,
        twelfthYOP: true,
        twelfthPercentage: true,
        tenthDegree: true,
        tenthYOP: true,
        tenthPercentage: true,
        
        // Identification
        aadharNumber: true,
        panCard: true,
        
        // Bank
        bankHolderName: true,
        bankName: true,
        bankAccountNumber: true,
        ifscCode: true,
        bankBranch: true,
        
        // Government
        uanNumber: true,
        pfNumber: true,
        
        // Assets
        laptopProvider: true,
        assetDetails: true,
        idCardProvided: true,
        bgvProvided: true,
        
        // Previous
        previousCompany: true,
        photoUrl: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "admin" && user.employeeStatus === "INACTIVE") {
      const response = NextResponse.json(
        { error: "Your account is inactive. Please contact HR.", code: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
      response.cookies.delete("token");
      return response;
    }

    const normalizedUser = {
      ...user,
      name: getDisplayName(user),
    };

    return NextResponse.json({ user: normalizedUser }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
