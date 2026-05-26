import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const resolvedParams = await params;
    const vehicleId = resolvedParams.id;

    if (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const objectId = new mongoose.Types.ObjectId(vehicleId);
    const index = user.wishlist.findIndex((id) => id.toString() === vehicleId);

    let isSaved = false;
    if (index > -1) {
      // Remove from wishlist
      user.wishlist.splice(index, 1);
      isSaved = false;
    } else {
      // Add to wishlist
      user.wishlist.push(objectId);
      isSaved = true;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      isSaved,
      wishlist: user.wishlist.map((id) => id.toString()),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to toggle wishlist" }, { status: 500 });
  }
}
