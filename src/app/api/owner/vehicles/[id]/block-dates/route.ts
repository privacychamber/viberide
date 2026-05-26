import { NextResponse } from "next/server";
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update blocked dates" }, { status: 500 });
  }
}
