import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * GET /api/employees
 * Fetches all employees in the system
 */
export async function GET(request: NextRequest) {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ["employee", "admin", "intern"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        designation: true,
        profileImageUrl: true,
        role: true,
        dateOfJoining: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        bloodGroup: true,
        location: true,
        dateOfBirth: true,
        gender: true,
        maritalStatus: true,
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
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/employees
 * Creates a new employee/user in the system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      firstName,
      middleName,
      lastName,
      phone,
      designation,
      bloodGroup,
      location,
      dateOfBirth,
      gender,
      maritalStatus,
      dateOfMarriage,
      fatherName,
      motherName,
      personalEmail,
      alternateContact,
      emergencyContact,
      currentAddress,
      permanentAddress,
      employeeId,
      projectClient,
      designationAtCompany,
      dateOfJoining,
      dateOfDeployment,
      totalExperience,
      dateOfExit,
      masterDegree,
      masterYOP,
      masterPercentage,
      secondaryDegree,
      secondaryYOP,
      secondaryPercentage,
      twelfthDegree,
      twelfthYOP,
      twelfthPercentage,
      tenthDegree,
      tenthYOP,
      tenthPercentage,
      aadharNumber,
      panCard,
      citizenship,
      bankHolderName,
      bankName,
      bankAccountNumber,
      ifscCode,
      bankBranch,
      uanNumber,
      pfNumber,
      laptopProvider,
      assetDetails,
      idCardProvided,
      bgvProvided,
      previousCompany,
    } = body;

    // Validation
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    // Validate role enum
    const validRoles = ["admin", "employee", "intern"];
    const normalizedRole = role.toLowerCase();
    
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Check for duplicate Aadhar Number (if provided)
    if (aadharNumber) {
      const existingAadhar = await prisma.user.findFirst({
        where: { aadharNumber },
      });
      if (existingAadhar) {
        return NextResponse.json(
          { error: "Aadhar Number already exists" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate PAN Card (if provided)
    if (panCard) {
      const existingPan = await prisma.user.findFirst({
        where: { panCard },
      });
      if (existingPan) {
        return NextResponse.json(
          { error: "PAN Card already exists" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate Bank Account Number (if provided)
    if (bankAccountNumber) {
      const existingAccount = await prisma.user.findFirst({
        where: { bankAccountNumber },
      });
      if (existingAccount) {
        return NextResponse.json(
          { error: "Bank Account Number already exists" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate UAN Number (if provided)
    if (uanNumber) {
      const existingUan = await prisma.user.findFirst({
        where: { uanNumber },
      });
      if (existingUan) {
        return NextResponse.json(
          { error: "UAN Number already exists" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate PF Number (if provided)
    if (pfNumber) {
      const existingPf = await prisma.user.findFirst({
        where: { pfNumber },
      });
      if (existingPf) {
        return NextResponse.json(
          { error: "PF Number already exists" },
          { status: 409 }
        );
      }
    }

    // Hash password (password is required, no default)
    if (!password || password.trim() === "") {
      return NextResponse.json(
        { error: "Password is required when creating a new employee" },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with all fields
    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: normalizedRole as any,
        firstName,
        middleName,
        lastName,
        phone,
        designation,
        bloodGroup,
        location,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        maritalStatus,
        dateOfMarriage: dateOfMarriage ? new Date(dateOfMarriage) : null,
        fatherName,
        motherName,
        personalEmail,
        alternateContact,
        emergencyContact,
        currentAddress,
        permanentAddress,
        employeeId,
        projectClient,
        designationAtCompany,
        dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
        dateOfDeployment: dateOfDeployment ? new Date(dateOfDeployment) : null,
        totalExperience: totalExperience ? parseFloat(totalExperience) : null,
        dateOfExit: dateOfExit ? new Date(dateOfExit) : null,
        masterDegree,
        masterYOP: masterYOP ? parseInt(masterYOP) : null,
        masterPercentage: masterPercentage ? parseFloat(masterPercentage) : null,
        secondaryDegree,
        secondaryYOP: secondaryYOP ? parseInt(secondaryYOP) : null,
        secondaryPercentage: secondaryPercentage
          ? parseFloat(secondaryPercentage)
          : null,
        twelfthDegree,
        twelfthYOP: twelfthYOP ? parseInt(twelfthYOP) : null,
        twelfthPercentage: twelfthPercentage
          ? parseFloat(twelfthPercentage)
          : null,
        tenthDegree,
        tenthYOP: tenthYOP ? parseInt(tenthYOP) : null,
        tenthPercentage: tenthPercentage ? parseFloat(tenthPercentage) : null,
        aadharNumber,
        panCard,
        citizenship,
        bankHolderName,
        bankName,
        bankAccountNumber,
        ifscCode,
        bankBranch,
        uanNumber,
        pfNumber,
        laptopProvider,
        assetDetails,
        idCardProvided: idCardProvided || false,
        bgvProvided: bgvProvided || false,
        previousCompany,
      },
      select: {
        id: true,
        name: true,
        email: true,
        designation: true,
        role: true,
        dateOfJoining: true,
      },
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
