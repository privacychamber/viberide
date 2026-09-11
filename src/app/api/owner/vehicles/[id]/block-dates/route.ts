import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "owner" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized. Host role required." }, { status: 401 });
    }

    const resolvedParams = await params;
    const vehicleId = resolvedParams.id;

    // Validate ObjectId (P0-10)
    if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID format." }, { status: 400 });
    }

    const { blockedDates } = await req.json(); // Array of ISO Date strings

    if (!Array.isArray(blockedDates)) {
      return NextResponse.json({ error: "Invalid dates array format" }, { status: 400 });
    }

    await dbConnect();

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Verify ownership
    if (vehicle.owner.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. You do not own this vehicle." }, { status: 403 });
    }

    // Map string dates to Date objects
    vehicle.blockedDates = blockedDates.map((dateStr) => new Date(dateStr));
    await vehicle.save();

    return NextResponse.json({
      success: true,
      message: "Blocked dates updated successfully!",
      blockedDates: vehicle.blockedDates,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update blocked dates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
