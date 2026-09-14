import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { frontUrl, backUrl, selfieUrl } = await req.json();

    // Ensure URLs strictly point to the user's secure KYC documents
    const isValidKycUrl = (url: string) => {
      if (!url) return false;
      try {
        // URLs must be relative to our API or start with our domain, and point to the user's KYC directory
        return url.includes(`/api/documents/kyc%2F${session.user.id}`) || url.includes(`/api/documents/kyc/${session.user.id}`);
      } catch {
        return false;
      }
    };

    if ((frontUrl && !isValidKycUrl(frontUrl)) || 
        (backUrl && !isValidKycUrl(backUrl)) || 
        (selfieUrl && !isValidKycUrl(selfieUrl))) {
      return NextResponse.json({ error: "Invalid document URL provided. External URLs are not permitted." }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update license state to pending review
    user.license = {
      frontUrl: frontUrl || "",
      backUrl: backUrl || "",
      status: "pending",
    };
    user.selfieUrl = selfieUrl || "";
    user.verified = false; // goes to admin approval queue

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Verification documents submitted successfully!",
      user: {
        id: user._id.toString(),
        name: user.name,
        licenseStatus: user.license.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit verification details" }, { status: 500 });
  }
}
