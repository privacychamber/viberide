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
    const body = await req.json();
    const { action, flagged } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (flagged !== undefined) {
      user.flagged = flagged;
      await user.save();
      return NextResponse.json({
        success: true,
        message: `User fraud flag updated to ${flagged}.`,
        user: {
          id: user._id.toString(),
          verified: user.verified,
          licenseStatus: user.license?.status,
          flagged: user.flagged,
        },
      });
    }

    if (!action || (action !== "verify" && action !== "reject")) {
      return NextResponse.json({ error: "Invalid parameters. action or flagged is required." }, { status: 400 });
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
        licenseStatus: user.license?.status,
        flagged: user.flagged,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user verification" }, { status: 500 });
  }
}
