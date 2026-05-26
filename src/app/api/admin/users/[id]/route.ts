import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    const { action } = await req.json();

    if (!userId || !action || (action !== "verify" && action !== "reject")) {
      return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (action === "verify") {
      user.license = {
        ...user.license,
        status: "verified",
      };
      user.verified = true;
    } else {
      user.license = {
        ...user.license,
        status: "rejected",
      };
      user.verified = false;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: `User KYC ${action === "verify" ? "approved" : "rejected"} successfully!`,
      user: {
        id: user._id.toString(),
        verified: user.verified,
        licenseStatus: user.license.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user verification" }, { status: 500 });
  }
}
