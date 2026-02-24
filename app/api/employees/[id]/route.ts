import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * GET /api/employees/[id]
 * Fetches a specific employee by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        name: true,
        email: true,
        designation: true,
        role: true,
        dateOfJoining: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        profileImageUrl: true,
        bloodGroup: true,
        location: true,
        dateOfBirth: true,
        gender: true,
        maritalStatus: true,
        dateOfMarriage: true,
        fatherName: true,
        motherName: true,
        personalEmail: true,
        alternateContact: true,
        emergencyContact: true,
        currentAddress: true,
        permanentAddress: true,
        employeeId: true,
        projectClient: true,
        designationAtCompany: true,
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
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/employees/[id]
 * Updates an employee's details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Create updateData object with proper type conversion
    const updateData: any = {};

    // List of fields that need type conversion
    const dateFields = [
      "dateOfBirth",
      "dateOfJoining",
      "dateOfMarriage",
      "dateOfDeployment",
      "dateOfExit",
    ];
    const numberFields = [
      "masterYOP",
      "masterPercentage",
      "secondaryYOP",
      "secondaryPercentage",
      "twelfthYOP",
      "twelfthPercentage",
      "tenthYOP",
      "tenthPercentage",
      "totalExperience",
    ];
    const booleanFields = ["idCardProvided", "bgvProvided"];

    // Process each field
    Object.keys(body).forEach((key) => {
      // Skip the id field
      if (key === "id") return;

      const value = body[key];

      // Skip undefined, null, or empty string values
      if (value === undefined || value === null || value === "") {
        return;
      }

      // Handle date conversions
      if (dateFields.includes(key)) {
        updateData[key] = new Date(value);
      }
      // Handle numeric conversions
      else if (numberFields.includes(key)) {
        updateData[key] = parseFloat(value);
      }
      // Handle boolean conversions
      else if (booleanFields.includes(key)) {
        updateData[key] = value === true || value === "true";
      }
      // Handle string fields (but don't process password yet, we'll hash it separately)
      else if (key !== "password") {
        updateData[key] = value;
      }
    });

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if new email already exists
    if (updateData.email && updateData.email !== employee.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate Aadhar Number (if being changed)
    if (updateData.aadharNumber && updateData.aadharNumber !== employee.aadharNumber) {
      const existingAadhar = await prisma.user.findFirst({
        where: { aadharNumber: updateData.aadharNumber },
      });
      if (existingAadhar) {
        return NextResponse.json(
          { error: "Aadhar Number already exists" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate PAN Card (if being changed)
    if (updateData.panCard && updateData.panCard !== employee.panCard) {
      const existingPan = await prisma.user.findFirst({
        where: { panCard: updateData.panCard },
      });
      if (existingPan) {
        return NextResponse.json(
          { error: "PAN Card already exists" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate Bank Account Number (if being changed)
    if (updateData.bankAccountNumber && updateData.bankAccountNumber !== employee.bankAccountNumber) {
      const existingAccount = await prisma.user.findFirst({
        where: { bankAccountNumber: updateData.bankAccountNumber },
      });
      if (existingAccount) {
        return NextResponse.json(
          { error: "Bank Account Number already exists" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate UAN Number (if being changed)
    if (updateData.uanNumber && updateData.uanNumber !== employee.uanNumber) {
      const existingUan = await prisma.user.findFirst({
        where: { uanNumber: updateData.uanNumber },
      });
      if (existingUan) {
        return NextResponse.json(
          { error: "UAN Number already exists" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate PF Number (if being changed)
    if (updateData.pfNumber && updateData.pfNumber !== employee.pfNumber) {
      const existingPf = await prisma.user.findFirst({
        where: { pfNumber: updateData.pfNumber },
      });
      if (existingPf) {
        return NextResponse.json(
          { error: "PF Number already exists" },
          { status: 409 }
        );
      }
    }

    // Hash password if it's being updated
    if (body.password && body.password.trim() !== "") {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // Update employee
    const updatedEmployee = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        designation: true,
        role: true,
        dateOfJoining: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        profileImageUrl: true,
        bloodGroup: true,
        location: true,
        dateOfBirth: true,
        gender: true,
        maritalStatus: true,
        dateOfMarriage: true,
        fatherName: true,
        motherName: true,
        personalEmail: true,
        alternateContact: true,
        emergencyContact: true,
        currentAddress: true,
        permanentAddress: true,
        employeeId: true,
        projectClient: true,
        designationAtCompany: true,
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
      },
    });

    return NextResponse.json(updatedEmployee, { status: 200 });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/employees/[id]
 * Deletes an employee
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(
      { message: "Employee deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
