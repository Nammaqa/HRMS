import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/all-data
 * Fetches all users with complete data from the User table
 */
export async function GET(request: NextRequest) {
  try {
    // Get all users with ALL fields from the database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        profileImageUrl: true,
        designation: true,
        bloodGroup: true,
        location: true,
        dateOfBirth: true,
        gender: true,
        maritalStatus: true,
        dateOfMarriage: true,
        fatherName: true,
        motherName: true,
        alternateContact: true,
        emergencyContact: true,
        personalEmail: true,
        currentAddress: true,
        permanentAddress: true,
        employeeId: true,
        projectClient: true,
        designationAtCompany: true,
        dateOfJoining: true,
        dateOfDeployment: true,
        totalExperience: true,
        dateOfExit: true,
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
        aadharNumber: true,
        panCard: true,
        citizenship: true,
        bankHolderName: true,
        bankName: true,
        bankAccountNumber: true,
        ifscCode: true,
        bankBranch: true,
        uanNumber: true,
        pfNumber: true,
        laptopProvider: true,
        assetDetails: true,
        idCardProvided: true,
        bgvProvided: true,
        previousCompany: true,
        lastLoginAt: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching all user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
