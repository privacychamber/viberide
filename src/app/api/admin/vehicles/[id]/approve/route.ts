import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const resolvedParams = await params;
    const vehicleId = resolvedParams.id;

    // Validate ObjectId (P0-10)
    if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID format." }, { status: 400 });
    }

    const { status, featured, flagged } = await req.json();

    await dbConnect();

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    if (status !== undefined) {
      if (status !== "approved" && status !== "rejected" && status !== "pending") {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      vehicle.status = status;
    }

    if (featured !== undefined) {
      vehicle.featured = featured;
    }

    if (flagged !== undefined) {
      vehicle.flagged = flagged;
    }

    await vehicle.save();

    return NextResponse.json({
      success: true,
      message: "Vehicle settings updated successfully!",
      vehicle,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update vehicle status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
