import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";

export async function PUT(
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
    const updates = await req.json();

    await dbConnect();

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Verify ownership
    if (vehicle.owner.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. You do not own this vehicle." }, { status: 403 });
    }

    // Apply updates
    if (updates.title) vehicle.title = updates.title;
    if (updates.brand) vehicle.brand = updates.brand;
    if (updates.model) vehicle.model = updates.model;
    if (updates.type) vehicle.type = updates.type;
    if (updates.pricePerDay) vehicle.pricePerDay = updates.pricePerDay;
    if (updates.location) vehicle.location = updates.location;
    if (updates.images) vehicle.images = updates.images;
    if (updates.specs) vehicle.specs = { ...vehicle.specs, ...updates.specs };
    if (updates.documents) vehicle.documents = { ...vehicle.documents, ...updates.documents };

    // Reset status to pending upon edit for admin re-verification
    if (session.user.role !== "admin") {
      vehicle.status = "pending";
    }

    await vehicle.save();

    return NextResponse.json({
      success: true,
      message: "Vehicle updated successfully! Awaiting admin review.",
      vehicle,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(
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

    await dbConnect();

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Verify ownership
    if (vehicle.owner.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. You do not own this vehicle." }, { status: 403 });
    }

    await Vehicle.findByIdAndDelete(vehicleId);

    return NextResponse.json({
      success: true,
      message: "Vehicle deleted successfully!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete vehicle" }, { status: 500 });
  }
}
