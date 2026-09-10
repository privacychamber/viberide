import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, role } = await req.json();

    if (!name || !phone || !password || !email) {
      return NextResponse.json(
        { message: "Name, email, phone number, and password are all required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { message: "Please provide a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ phone: cleanPhone }, { email: cleanEmail }],
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // If user exists and is already verified, block duplicate registration
      if (existingUser.emailVerified) {
        if (existingUser.phone === cleanPhone) {
          return NextResponse.json(
            { message: "This phone number is already registered. Please login instead." },
            { status: 409 }
          );
        }
        if (existingUser.email === cleanEmail) {
          return NextResponse.json(
            { message: "This email address is already registered. Please login instead." },
            { status: 409 }
          );
        }
      } else {
        // If unverified user exists, update their details and refresh the OTP
        existingUser.name = name;
        existingUser.email = cleanEmail;
        existingUser.phone = cleanPhone;
        existingUser.password = hashedPassword;
        existingUser.role = role === "owner" ? "owner" : "renter";
        existingUser.emailOtp = otp;
        existingUser.emailOtpExpires = otpExpires;
        await existingUser.save();

        // Send OTP email
        try {
          await sendVerificationEmail({ to: cleanEmail, name, otp });
        } catch (mailErr) {
          console.error("Mail send error during update:", mailErr);
        }

        return NextResponse.json(
          {
            message: "Verification code sent to your email.",
            email: cleanEmail,
            phone: cleanPhone,
          },
          { status: 200 }
        );
      }
    }

    // Create the new user with pending email verification
    await User.create({
      name,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: role === "owner" ? "owner" : "renter",
      verified: false,
      emailVerified: false,
      emailOtp: otp,
      emailOtpExpires: otpExpires,
      license: { status: "none" },
    });

    // Dispatch verification email via SMTP
    try {
      await sendVerificationEmail({ to: cleanEmail, name, otp });
    } catch (mailErr) {
      console.error("Mail send error during signup:", mailErr);
    }

    return NextResponse.json(
      {
        message: "Verification code sent to your email.",
        email: cleanEmail,
        phone: cleanPhone,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: error?.message || "An error occurred during registration." },
      { status: 500 }
    );
  }
}
