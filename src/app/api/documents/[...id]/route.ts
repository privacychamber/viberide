import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";
import { getStorageDriver } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string[] }> }
) {
  try {
    // 1. Authenticate requester
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const resolvedParams = await params;
    
    if (!resolvedParams.id || resolvedParams.id.length === 0) {
      return NextResponse.json({ error: "Missing document ID." }, { status: 400 });
    }

    // Reconstruct the path (e.g., ['kyc', 'user123', 'uuid.pdf'] -> 'kyc/user123/uuid.pdf')
    // We decode it to handle any URL-encoded characters
    const rawPath = resolvedParams.id.map(p => decodeURIComponent(p)).join('/');

    // Prevent directory traversal attacks explicitly
    if (rawPath.includes("..") || rawPath.startsWith("/")) {
      return NextResponse.json({ error: "Invalid document path." }, { status: 400 });
    }

    // Since we're using random UUIDs inside user folders, the storage key acts as an identifier.
    // E.g., kyc/<user-id>/<uuid>.pdf
    
    // 2. Determine Authorization
    let isAuthorized = false;

    // Rule A: Administrator has universal verification access
    if (session.user.role === "admin") {
      isAuthorized = true;
    }

    // Rule B: Requester owns the document
    // User KYC documents are stored under kyc/<user-id>/
    if (rawPath.startsWith(`kyc/${session.user.id}/`)) {
      isAuthorized = true;
    }

    // Rule C: Host/owner accessing an RC or Insurance document for their vehicle
    if (!isAuthorized && session.user.role === "owner" && rawPath.startsWith("kyc/")) {
        // Technically vehicle docs used to be in kyc, or maybe documents.
        // The user specifies we check ownership of the vehicle
        await dbConnect();
        // Since we store full keys in DB, we check if the path exists in the user's vehicles.
        // We use exact equality check (or regex if needed, but exact is better)
        const encodedPath = encodeURIComponent(rawPath); // DB might store URL encoded or raw? Actually it stores the return from upload.
        // Upload returns `/api/documents/${encodeURIComponent(objectKey)}`
        // So we just check if any vehicle has this path. We'll use exact matching on the relative path.
        const vehicleDocExists = await Vehicle.exists({
          owner: session.user.id,
          $or: [
            { "documents.rcUrl": { $regex: rawPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } },
            { "documents.insuranceUrl": { $regex: rawPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } },
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
    const result = await storageDriver.getPrivateDocument(rawPath);

    if (!result) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // In case local driver is used, it returns buffer
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

    // For Stream results (from LocalPersistentStorageDriver), return a ReadableStream
    if (result.type === "stream" && result.stream) {
      return new NextResponse(result.stream, {
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
