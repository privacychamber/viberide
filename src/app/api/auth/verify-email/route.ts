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

    // Action: Resend OTP (Atomic MongoDB Operation)
    if (action === "resend") {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const newOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10-minute expiry
      const cooldownThreshold = new Date(Date.now() + 9 * 60 * 1000); // 60s cooldown threshold

      // Atomically check cooldown and update OTP in a single operation
      const updatedUser = await User.findOneAndUpdate(
        {
          email: cleanEmail,
          emailVerified: false,
          $or: [
            { emailOtpExpires: { $exists: false } },
            { emailOtpExpires: null },
            { emailOtpExpires: { $lte: cooldownThreshold } },
          ],
        },
        {
          $set: {
            emailOtp: newOtp,
            emailOtpExpires: newOtpExpires,
          },
        },
        { new: false } // Returns previous document state before update
      );

      // If no document was updated, determine the exact reason (user not found, already verified, or cooldown active)
      if (!updatedUser) {
        const existing = await User.findOne({ email: cleanEmail }).select("emailVerified emailOtpExpires");
        if (!existing) {
          return NextResponse.json(
            { message: "User account not found." },
            { status: 404 }
          );
        }

        if (existing.emailVerified) {
          return NextResponse.json(
            { message: "This account email is already verified. Please login." },
            { status: 400 }
          );
        }

        // Active cooldown: concurrent or repeated request lost the race
        const timeRemainingMs = existing.emailOtpExpires
          ? new Date(existing.emailOtpExpires).getTime() - Date.now()
          : 0;
        const minAllowedRemainingMs = 9 * 60 * 1000;
        const waitSeconds = Math.max(1, Math.ceil((timeRemainingMs - minAllowedRemainingMs) / 1000));
        return NextResponse.json(
          { message: `Please wait ${waitSeconds} seconds before requesting another verification code.` },
          { status: 429 }
        );
      }

      // Dispatch verification email via SMTP
      try {
        await sendVerificationEmail({
          to: cleanEmail,
          name: updatedUser.name,
          otp: newOtp,
        });
      } catch (mailErr) {
        console.error("Resend mail error:", mailErr);
        // Rollback state so the user is not locked out by an SMTP delivery failure
        await User.updateOne(
          { _id: updatedUser._id },
          {
            $set: {
              emailOtp: updatedUser.emailOtp,
              emailOtpExpires: updatedUser.emailOtpExpires,
            },
          }
        );
        return NextResponse.json(
          { message: "Failed to send verification email. Please try again in a moment." },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { message: "A new verification code has been sent to your email." },
        { status: 200 }
      );
    }

    // Action: Verify OTP
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json(
        { message: "User account not found." },
        { status: 404 }
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
  } catch (error: unknown) {
    console.error("Verification error:", error);
    const message = error instanceof Error ? error.message : "An error occurred during verification.";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
