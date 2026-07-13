import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getAuthenticatedUser } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const maxFileSize = 10 * 1024 * 1024;

function getAllowedFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const allowedExtensions = ["pdf", "docx", "xlsx", "pptx"];

  return allowedExtensions.includes(extension);
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const policies = await prisma.policy.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json({ success: true, data: policies });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get("title")?.toString().trim();
    const description = formData.get("description")?.toString().trim() || "";
    const file = formData.get("file") as File | null;
    const downloadEnabled = formData.get("downloadEnabled") === "true" || formData.get("downloadEnabled") === "on";

    if (!title) {
      return NextResponse.json({ success: false, error: "Policy title is required" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ success: false, error: "Please upload a document" }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ success: false, error: "File size must be 10MB or less" }, { status: 400 });
    }

    if (!allowedMimeTypes.includes(file.type) && !getAllowedFileName(file.name)) {
      return NextResponse.json({ success: false, error: "Only PDF, DOCX, XLSX, and PPTX files are supported" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadToCloudinary(buffer);

    const policy = await prisma.policy.create({
      data: {
        title,
        description,
        fileName: file.name,
        fileUrl: result?.secure_url || "",
        publicId: result?.public_id || "",
        mimeType: file.type || result?.resource_type || "application/octet-stream",
        fileSize: file.size,
        downloadEnabled,
        uploadedById: admin.id,
      },
    });

    return NextResponse.json({ success: true, data: policy });
  } catch (error) {
    console.error("Create policy error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload policy" }, { status: 500 });
  }
}
