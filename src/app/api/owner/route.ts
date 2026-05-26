import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";
import Booking from "@/models/Booking";
import User from "@/models/User"; // import to register User schema for populate

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "owner" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized. Host role required." }, { status: 401 });
    }

    await dbConnect();

    // 1. Fetch vehicles owned by this host
    const vehicles = await Vehicle.find({ owner: session.user.id }).lean();
    const vehicleIds = vehicles.map((v) => v._id);

    // 2. Fetch bookings for these vehicles
    const bookings = await Booking.find({ vehicle: { $in: vehicleIds } })
      .populate("vehicle", "title brand model pricePerDay images location")
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    // 3. Calculate earnings: sum of approved or completed bookings minus 10% commission
    const approvedBookings = bookings.filter((b) => b.status === "approved" || b.status === "completed");
    const grossEarnings = approvedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const netEarnings = Math.round(grossEarnings * 0.9); // 10% platform commission

    // Serialize MongoDB ObjectIds
    const serializedVehicles = vehicles.map((v) => ({
      ...v,
      _id: v._id.toString(),
      owner: v.owner.toString(),
    }));

    const serializedBookings = bookings.map((b) => ({
      ...b,
      _id: b._id.toString(),
      user: {
        ...(b.user as any),
        _id: (b.user as any)._id.toString(),
      },
      vehicle: {
        ...(b.vehicle as any),
        _id: (b.vehicle as any)._id.toString(),
      },
    }));

    return NextResponse.json({
      success: true,
      vehicles: serializedVehicles,
      bookings: serializedBookings,
      earnings: netEarnings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load host dashboard data" }, { status: 500 });
  }
}
