import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Booking from "@/models/Booking";
import Vehicle from "@/models/Vehicle";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "owner" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized. Host role required." }, { status: 401 });
    }

    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    const { status } = await req.json();

    if (!bookingId || !status || (status !== "approved" && status !== "rejected" && status !== "completed" && status !== "cancelled")) {
      return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
    }

    await dbConnect();

    // 1. Fetch Booking and check host matches vehicle owner
    const booking = await Booking.findById(bookingId).populate("vehicle");
    if (!booking) {
      return NextResponse.json({ error: "Booking request not found." }, { status: 404 });
    }

    const vehicle = booking.vehicle as any;
    if (vehicle.owner.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. You do not own this vehicle." }, { status: 403 });
    }

    // 2. Update booking status
    booking.status = status;
    await booking.save();

    return NextResponse.json({
      success: true,
      message: `Booking request ${status} successfully!`,
      booking: {
        id: booking._id.toString(),
        status: booking.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update booking status" }, { status: 500 });
  }
}
