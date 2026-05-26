import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Vehicle from "@/models/Vehicle";
import Booking from "@/models/Booking";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 401 });
    }

    await dbConnect();

    // 1. Fetch verification queue
    const usersQueue = await User.find({ "license.status": "pending" }).lean();

    // 2. Compute statistics
    const totalUsers = await User.countDocuments({});
    const verifiedUsers = await User.countDocuments({ "license.status": "verified" });
    const totalVehicles = await Vehicle.countDocuments({});
    const totalBookings = await Booking.countDocuments({});

    // Compute commission from all approved/completed bookings (10% platform share)
    const approvedBookings = await Booking.find({ status: { $in: ["approved", "completed"] } }).select("totalPrice").lean();
    const grossBookingsSum = approvedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalCommissions = Math.round(grossBookingsSum * 0.1); // 10% commission

    return NextResponse.json({
      success: true,
      usersQueue: usersQueue.map((u) => ({
        ...u,
        _id: u._id.toString(),
      })),
      stats: {
        totalUsers,
        verifiedUsers,
        totalVehicles,
        totalBookings,
        totalCommissions,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load admin stats" }, { status: 500 });
  }
}
