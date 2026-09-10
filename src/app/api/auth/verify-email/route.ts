import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, action } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    await dbConnect();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json(
        { message: "User account not found." },
        { status: 404 }
      );
    }

    // Action: Resend OTP
    if (action === "resend") {
      if (user.emailVerified) {
        return NextResponse.json(
          { message: "This account email is already verified. Please login." },
          { status: 400 }
        );
      }

      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const newOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

      user.emailOtp = newOtp;
      user.emailOtpExpires = newOtpExpires;
      await user.save();

      try {
        await sendVerificationEmail({
          to: cleanEmail,
          name: user.name,
          otp: newOtp,
        });
      } catch (mailErr) {
        console.error("Resend mail error:", mailErr);
      }

      return NextResponse.json(
        { message: "A new verification code has been sent to your email." },
        { status: 200 }
      );
    }

    // Action: Verify OTP
    if (!otp) {
      return NextResponse.json(
        { message: "Please enter the 6-digit verification code." },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified. You can now login.", alreadyVerified: true },
        { status: 200 }
      );
    }

    if (!user.emailOtp || !user.emailOtpExpires) {
      return NextResponse.json(
        { message: "No active verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.emailOtpExpires)) {
      return NextResponse.json(
        { message: "The verification code has expired. Please click resend to receive a new one." },
        { status: 400 }
      );
    }

    if (user.emailOtp.trim() !== otp.trim()) {
      return NextResponse.json(
        { message: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // Verification successful
    user.emailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    return NextResponse.json(
      {
        message: "Email verified successfully! You can now login to your account.",
        verified: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: error?.message || "An error occurred during verification." },
      { status: 500 }
    );
  }
}
