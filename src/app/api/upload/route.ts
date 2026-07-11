import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + "-" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    // Path to public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if dir exists
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return the URL that can be used on the frontend
    const url = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
