import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(payload.userId) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      employeeStatus: true,
    },
  });

  if (user && user.role !== "admin" && user.employeeStatus === "INACTIVE") {
    return null;
  }

  return user;
}

export async function requireAdmin(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}
