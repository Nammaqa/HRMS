import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Filter out undefined, null, empty strings and non-updatable fields
    const updateData: any = {};
    
    // helper arrays for type conversions
    const dateFields = [
      "dateOfBirth",
      "dateOfMarriage",
      "dateOfJoining",
      "dateOfDeployment",
      "dateOfExit",
      "lastLoginAt",
    ];
    const intFields = [
      "masterYOP",
      "secondaryYOP",
      "twelfthYOP",
      "tenthYOP",
    ];
    const floatFields = [
      "totalExperience",
      "masterPercentage",
      "secondaryPercentage",
      "twelfthPercentage",
      "tenthPercentage",
    ];

    Object.keys(body).forEach((key) => {
      if (key === "id") return; // never update primary key
      const value = body[key];

      // Skip undefined or null
      if (value === undefined || value === null) return;
      // Skip empty strings (e.g. unset date fields)
      if (typeof value === "string" && value.trim() === "") return;

      let finalValue: any = value;

      // convert to Date for known date fields
      if (dateFields.includes(key) && typeof value === "string") {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          finalValue = d;
        }
      }

      // convert to int for some year-of-passing fields
      if (intFields.includes(key) && typeof value === "string") {
        const n = parseInt(value, 10);
        if (!isNaN(n)) {
          finalValue = n;
        }
      }

      // convert to float for percentage / experience fields
      if (floatFields.includes(key) && typeof value === "string") {
        const f = parseFloat(value);
        if (!isNaN(f)) {
          finalValue = f;
        }
      }

      updateData[key] = finalValue;
    });

    const updatedUser = await prisma.user.update({
      where: { id: typeof payload.userId === 'string' ? parseInt(payload.userId, 10) : payload.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        personalEmail: true,
        phone: true,
        alternateContact: true,
        emergencyContact: true,
        designation: true,
        designationAtCompany: true,
        bloodGroup: true,
        gender: true,
        location: true,
        profileImageUrl: true,
        dateOfBirth: true,
        maritalStatus: true,
        dateOfMarriage: true,
        fatherName: true,
        motherName: true,
        employeeId: true,
        projectClient: true,
        dateOfJoining: true,
        dateOfDeployment: true,
        totalExperience: true,
        dateOfExit: true,
        currentAddress: true,
        permanentAddress: true,
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
        role: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
