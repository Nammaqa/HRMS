import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getAuthenticatedUser } from "@/lib/auth";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const policy = await prisma.policy.findUnique({
    where: { id: Number(id) },
  });

  if (!policy) {
    return NextResponse.json({ success: false, error: "Policy not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: policy });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const policyId = Number(id);
    const existingPolicy = await prisma.policy.findUnique({ where: { id: policyId } });

    if (!existingPolicy) {
      return NextResponse.json({ success: false, error: "Policy not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const title = formData.get("title")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const file = formData.get("file") as File | null;
    const downloadEnabled = formData.get("downloadEnabled")?.toString();

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (!title) {
        return NextResponse.json({ success: false, error: "Policy title is required" }, { status: 400 });
      }
      updateData.title = title;
    }

    if (description !== undefined) {
      updateData.description = description || "";
    }

    if (downloadEnabled !== undefined) {
      updateData.downloadEnabled = downloadEnabled === "true" || downloadEnabled === "on";
    }

    if (file) {
      if (file.size > maxFileSize) {
        return NextResponse.json({ success: false, error: "File size must be 10MB or less" }, { status: 400 });
      }

      if (!allowedMimeTypes.includes(file.type) && !getAllowedFileName(file.name)) {
        return NextResponse.json({ success: false, error: "Only PDF, DOCX, XLSX, and PPTX files are supported" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await uploadToCloudinary(buffer);

      if (existingPolicy.publicId) {
        await deleteFromCloudinary(existingPolicy.publicId);
      }

      updateData.fileName = file.name;
      updateData.fileUrl = result?.secure_url || "";
      updateData.publicId = result?.public_id || "";
      updateData.mimeType = file.type || result?.resource_type || "application/octet-stream";
      updateData.fileSize = file.size;
    }

    const updatedPolicy = await prisma.policy.update({
      where: { id: policyId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedPolicy });
  } catch (error) {
    console.error("Update policy error:", error);
    return NextResponse.json({ success: false, error: "Failed to update policy" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const policyId = Number(id);
    const policy = await prisma.policy.findUnique({ where: { id: policyId } });

    if (!policy) {
      return NextResponse.json({ success: false, error: "Policy not found" }, { status: 404 });
    }

    if (policy.publicId) {
      try {
        await deleteFromCloudinary(policy.publicId);
      } catch (error) {
        console.error("Cloudinary delete error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete document from Cloudinary" }, { status: 500 });
      }
    }

    await prisma.policy.delete({ where: { id: policyId } });

    return NextResponse.json({ success: true, message: "Policy deleted successfully" });
  } catch (error) {
    console.error("Delete policy error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete policy" }, { status: 500 });
  }
}
