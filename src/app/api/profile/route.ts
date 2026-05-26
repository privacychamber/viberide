import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Booking from "@/models/Booking";
import Vehicle from "@/models/Vehicle"; // Import to register model for populate

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // 1. Fetch User details
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch bookings
    const bookings = await Booking.find({ user: session.user.id })
      .populate("vehicle", "title brand model pricePerDay location images")
      .sort({ createdAt: -1 })
      .lean();

    // Convert ObjectIds to strings
    const serializedUser = {
      ...user,
      _id: user._id.toString(),
    };

    const serializedBookings = bookings.map((b) => ({
      ...b,
      _id: b._id.toString(),
      user: b.user.toString(),
      vehicle: {
        ...(b.vehicle as any),
        _id: (b.vehicle as any)._id.toString(),
      },
    }));

    return NextResponse.json({
      success: true,
      user: serializedUser,
      bookings: serializedBookings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load profile" }, { status: 500 });
  }
}
