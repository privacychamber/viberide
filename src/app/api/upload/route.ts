import { NextResponse } from "next/server";
import path from "path";
import { auth } from "@/auth";
import { getStorageDriver, AssetCategory } from "@/lib/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
]);

export async function POST(request: Request) {
  try {
    // 1. Require authenticated session (derive identity strictly from server session)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in to upload files." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const clientCategory = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. Enforce maximum upload size (5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit." },
        { status: 400 }
      );
    }

    // 3. Strict MIME allowlist validation
    const mimeType = (file.type || "").toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Only JPEG, PNG, WEBP images and PDF documents are allowed.",
        },
        { status: 400 }
      );
    }

    // 4. Strict extension allowlist validation
    const ext = path.extname(file.name || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file extension. Only .jpg, .jpeg, .png, .webp, and .pdf files are allowed.",
        },
        { status: 400 }
      );
    }

    // Cross-verify MIME vs extension to prevent disguised files
    if (mimeType === "application/pdf" && ext !== ".pdf") {
      return NextResponse.json({ error: "File extension does not match MIME type." }, { status: 400 });
    }
    if (mimeType.startsWith("image/") && ext === ".pdf") {
      return NextResponse.json({ error: "File extension does not match MIME type." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Double-check file buffer header for executable/script content
    const header = buffer.subarray(0, 512).toString("utf8").toLowerCase();
    if (
      header.includes("<html") ||
      header.includes("<script") ||
      header.includes("<?php") ||
      header.includes("<svg") ||
      header.includes("<!doctype html")
    ) {
      return NextResponse.json(
        { error: "File contains potentially malicious script or executable content." },
        { status: 400 }
      );
    }

    // 5. Determine and validate category server-side (enforcing role permissions)
    let category: AssetCategory = "kyc";
    const userRole = session.user.role || "renter";

    if (clientCategory === "vehicle" || clientCategory === "document" || clientCategory === "kyc") {
      category = clientCategory;
    } else {
      // Inferred defaults preserving compatibility
      if (userRole === "renter") {
        category = "kyc";
      } else if (mimeType === "application/pdf") {
        category = "document";
      } else {
        category = "vehicle";
      }
    }

    // Role-based Category Authorization:
    // Only hosts (owners) and admins may upload vehicle listing imagery and vehicle registration documents
    if (category === "vehicle" || category === "document") {
      if (userRole !== "owner" && userRole !== "admin") {
        return NextResponse.json(
          { error: "Forbidden. Host or administrator role required to upload vehicle assets." },
          { status: 403 }
        );
      }
    }

    // 6. Provide the original file name to the storage driver (it will generate a secure UUID-based key and use the extension)
    const filename = file.name || "upload.bin";

    // 7. Store using local persistent storage
    const storageDriver = getStorageDriver();
    const result = await storageDriver.uploadFile({
      buffer,
      filename,
      mimeType,
      category,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      isPrivate: result.isPrivate,
      category,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
