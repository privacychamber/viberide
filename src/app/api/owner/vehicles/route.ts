import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "owner" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized. Host role required." }, { status: 401 });
    }

    const { title, brand, model, type, pricePerDay, location, specs, images } = await req.json();

    if (!title || !brand || !model || !type || !pricePerDay || !location) {
      return NextResponse.json({ error: "Missing required vehicle details." }, { status: 400 });
    }

    await dbConnect();

    const vehicle = await Vehicle.create({
      title,
      brand,
      model,
      type,
      pricePerDay,
      location,
      images: images || [],
      owner: session.user.id,
      availability: true,
      specs: specs || {},
    });

    return NextResponse.json({
      success: true,
      message: "Vehicle listed successfully!",
      vehicle: {
        id: vehicle._id.toString(),
        title: vehicle.title,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add vehicle" }, { status: 500 });
  }
}
