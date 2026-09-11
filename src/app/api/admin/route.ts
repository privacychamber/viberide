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

    // 1. Fetch queues and lists with sensitive fields excluded (P0-8)
    const usersQueue = await User.find({ "license.status": "pending" })
      .select("-password -emailOtp -emailOtpExpires")
      .lean();

    const vehiclesQueue = await Vehicle.find({ status: "pending" })
      .populate("owner", "name phone")
      .lean();

    const allVehicles = await Vehicle.find({})
      .populate("owner", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    const allUsers = await User.find({})
      .select("-password -emailOtp -emailOtpExpires")
      .sort({ role: 1, name: 1 })
      .lean();

    // 2. Compute statistics
    const totalUsers = await User.countDocuments({});
    const verifiedUsers = await User.countDocuments({ "license.status": "verified" });
    const totalVehicles = await Vehicle.countDocuments({});
    const totalBookings = await Booking.countDocuments({});

    // Compute commission from all approved/completed bookings (10% platform share)
    const approvedBookings = await Booking.find({ status: { $in: ["approved", "completed"] } })
      .select("totalPrice")
      .lean();
    const grossBookingsSum = approvedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalCommissions = Math.round(grossBookingsSum * 0.1); // 10% commission

    const formatSafeUser = (u: Record<string, unknown>) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      verified: u.verified,
      emailVerified: u.emailVerified,
      flagged: u.flagged,
      license: u.license,
      selfieUrl: u.selfieUrl,
      createdAt: u.createdAt,
    });

    return NextResponse.json({
      success: true,
      usersQueue: usersQueue.map((u) => formatSafeUser(u as unknown as Record<string, unknown>)),
      vehiclesQueue: vehiclesQueue.map((v) => ({
        ...v,
        _id: v._id.toString(),
      })),
      allVehicles: allVehicles.map((v) => ({
        ...v,
        _id: v._id.toString(),
      })),
      allUsers: allUsers.map((u) => formatSafeUser(u as unknown as Record<string, unknown>)),
      stats: {
        totalUsers,
        verifiedUsers,
        totalVehicles,
        totalBookings,
        totalCommissions,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load admin stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
