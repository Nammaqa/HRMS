import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear old data (order matters because of relations)
  await prisma.auditLog.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.wFHRequest.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const employeePassword = await bcrypt.hash("employee123", 10);

  // -------------------
  // Create Admin User
  // -------------------
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: adminPassword,
      role: Role.admin,
      phone: "9876543210",
      designation: "HR Manager",
      location: "Bangalore",
      gender: "Male",
      maritalStatus: "Married",
      fatherName: "Ramesh Kumar",
      motherName: "Sunita Devi",
      employeeId: "WB-ADMIN-001",
      dateOfJoining: new Date("2022-01-01"),
      personalEmail: "admin.personal@gmail.com",
      currentAddress: "Bangalore, Karnataka",
      permanentAddress: "Mysore, Karnataka",
      aadharNumber: "123412341234",
      panCard: "ABCDE1234F",
      bankHolderName: "Admin User",
      bankName: "HDFC Bank",
      bankAccountNumber: "123456789012",
      ifscCode: "HDFC0001234",
      uanNumber: "100200300400",
      pfNumber: "PF12345678",
      idCardProvided: true,
      bgvProvided: true,
    },
  });

  // -------------------
  // Create Employee
  // -------------------
  const employee = await prisma.user.create({
    data: {
      name: "John Employee",
      firstName: "John",
      lastName: "Doe",
      email: "employee@example.com",
      password: employeePassword,
      role: Role.employee,
      phone: "9123456789",
      designation: "Frontend Developer",
      location: "Bangalore",
      dateOfBirth: new Date("1999-05-15"),
      gender: "Male",
      maritalStatus: "Single",

      // Family
      fatherName: "Rajesh Doe",
      motherName: "Priya Doe",

      // Company Info
      employeeId: "WB-EMP-101",
      projectClient: "Wizzybox Internal",
      designationAtCompany: "React Developer",
      dateOfJoining: new Date("2023-06-01"),
      totalExperience: 2.5,

      // Contact
      alternateContact: "9000000000",
      emergencyContact: "9111111111",
      personalEmail: "john.doe@gmail.com",
      currentAddress: "Whitefield, Bangalore",
      permanentAddress: "Mandya, Karnataka",

      // Education
      masterDegree: "MCA",
      masterYOP: 2023,
      masterPercentage: 78.5,

      secondaryDegree: "BCA",
      secondaryYOP: 2021,
      secondaryPercentage: 80.2,

      twelfthDegree: "PUC",
      twelfthYOP: 2018,
      twelfthPercentage: 75.0,

      tenthDegree: "SSLC",
      tenthYOP: 2016,
      tenthPercentage: 82.0,

      // IDs
      aadharNumber: "432143214321",
      panCard: "PQRSX5678Y",
      citizenship: "Indian",

      // Bank
      bankHolderName: "John Doe",
      bankName: "SBI",
      bankAccountNumber: "987654321098",
      ifscCode: "SBIN0005678",
      bankBranch: "Mandya",

      // Govt
      uanNumber: "200300400500",
      pfNumber: "PF87654321",

      // Assets
      laptopProvider: "Wizzybox",
      assetDetails: "Dell Latitude 5420",
      idCardProvided: true,
      bgvProvided: false,

      previousCompany: "Infosys",

      lastLoginAt: new Date(),
    },
  });

  // -------------------
  // Leave Balance
  // -------------------
  await prisma.leaveBalance.create({
    data: {
      userId: employee.id,
      earnedLeave: 0, // Starts at 0, accrues 1.25/month unconditionally (applied monthly)
      sickLeave: 5,
      specialLeave: 1,
      lossOfPayDays: 0,
    },
  });

  console.log("✅ Seed completed successfully");
  console.log("Admin:", admin.email);
  console.log("Employee:", employee.email);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
