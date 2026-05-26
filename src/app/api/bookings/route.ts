import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Vehicle from "@/models/Vehicle";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { vehicleId, fromDate, toDate, totalPrice } = await req.json();

    if (!vehicleId || !fromDate || !toDate || !totalPrice) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    await dbConnect();

    // 1. Double check user verification status from DB
    const user = await User.findById(session.user.id);
    if (!user || user.license?.status !== "verified") {
      return NextResponse.json(
        { error: "Booking rejected. You must upload and verify your Driving License first." },
        { status: 403 }
      );
    }

    // 2. Validate vehicle existence
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
    }

    // 3. Create Booking
    const booking = await Booking.create({
      vehicle: vehicleId,
      user: session.user.id,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      totalPrice,
      status: "pending",
    });

    // Populate vehicle details before returning
    const populatedBooking = await Booking.findById(booking._id)
      .populate("vehicle", "title brand model pricePerDay location images")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Booking requested successfully!",
      booking: populatedBooking,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
  }
}
