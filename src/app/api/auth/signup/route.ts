import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, role } = await req.json();

    if (!name || !phone || !password) {
      return NextResponse.json(
        { message: "Name, phone, and password are required." },
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
      $or: [{ phone }, ...(email ? [{ email }] : [])],
    });

    if (existingUser) {
      if (existingUser.phone === phone) {
        return NextResponse.json(
          { message: "Phone number is already registered." },
          { status: 409 }
        );
      }
      if (email && existingUser.email === email) {
        return NextResponse.json(
          { message: "Email is already registered." },
          { status: 409 }
        );
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await User.create({
      name,
      email: email || undefined,
      phone,
      password: hashedPassword,
      role: role === "owner" ? "owner" : "renter",
      verified: false,
      license: { status: "none" },
    });

    return NextResponse.json(
      { message: "User registered successfully." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration." },
      { status: 500 }
    );
  }
}
