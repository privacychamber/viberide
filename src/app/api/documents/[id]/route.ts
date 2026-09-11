import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";
import { getStorageDriver } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate requester
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    if (!documentId) {
      return NextResponse.json({ error: "Missing document ID." }, { status: 400 });
    }

    // Sanitize document identifier to prevent directory traversal
    const sanitizedId = decodeURIComponent(documentId).replace(/[^a-zA-Z0-9._-]/g, "");

    // 2. Determine Authorization
    let isAuthorized = false;

    // Rule A: Administrator has universal verification access
    if (session.user.role === "admin") {
      isAuthorized = true;
    }

    // Rule B: Requester owns the document (user-scoped naming convention)
    if (
      sanitizedId.startsWith(`${session.user.id}-`) ||
      sanitizedId.startsWith(`${session.user.id}_`)
    ) {
      isAuthorized = true;
    }

    // Rule C: Host/owner accessing an RC or Insurance document for their vehicle
    if (!isAuthorized && session.user.role === "owner") {
      await dbConnect();
      const vehicleDocExists = await Vehicle.exists({
        owner: session.user.id,
        $or: [
          { "documents.rcUrl": { $regex: sanitizedId } },
          { "documents.insuranceUrl": { $regex: sanitizedId } },
        ],
      });
      if (vehicleDocExists) {
        isAuthorized = true;
      }
    }

    // Deny unauthorized access
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden. You are not authorized to access this private document." },
        { status: 403 }
      );
    }

    // 3. Fetch from Storage Driver
    const storageDriver = getStorageDriver();
    const result = await storageDriver.getPrivateDocument(sanitizedId);

    if (!result) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (result.type === "redirect" && result.redirectUrl) {
      return NextResponse.redirect(result.redirectUrl, 307);
    }

    if (result.type === "buffer" && result.buffer) {
      return new NextResponse(result.buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": result.mimeType || "application/octet-stream",
          "Content-Disposition": "inline",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return NextResponse.json({ error: "Unable to retrieve document." }, { status: 500 });
  } catch (error: unknown) {
    console.error("Private document access error:", error);
    const message = error instanceof Error ? error.message : "Failed to load document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
