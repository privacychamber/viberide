import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Booking from "@/models/Booking";
import "@/models/Vehicle"; // Import to register model for populate

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // 1. Fetch User details excluding sensitive fields (P0-8)
    const user = await User.findById(session.user.id)
      .select("-password -emailOtp -emailOtpExpires")
      .populate("wishlist")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch bookings
    const bookings = await Booking.find({ user: session.user.id })
      .populate("vehicle", "title brand model pricePerDay location images")
      .sort({ createdAt: -1 })
      .lean();

    // Strict allowlist projection for user details
    const serializedUser = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      verified: user.verified,
      emailVerified: user.emailVerified,
      license: user.license,
      selfieUrl: user.selfieUrl,
      wishlist: user.wishlist || [],
      createdAt: user.createdAt,
    };

    const serializedBookings = bookings.map((b) => {
      const v = b.vehicle as unknown as Record<string, unknown>;
      return {
        ...b,
        _id: b._id.toString(),
        user: b.user.toString(),
        vehicle: {
          ...v,
          _id: String(v?._id || ""),
        },
      };
    });

    return NextResponse.json({
      success: true,
      user: serializedUser,
      bookings: serializedBookings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
