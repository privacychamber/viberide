import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Vehicle from "@/models/Vehicle";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the requester
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { vehicleId, fromDate, toDate } = body;
    // Note: client-supplied totalPrice is intentionally ignored to prevent price manipulation

    // 2. Validate vehicleId format (P0-10)
    if (!vehicleId || typeof vehicleId !== "string" || !mongoose.Types.ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: "Invalid or missing vehicle ID." }, { status: 400 });
    }

    // 3. Validate booking dates (P0-3)
    if (!fromDate || !toDate) {
      return NextResponse.json({ error: "Missing required booking dates." }, { status: 400 });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format provided." }, { status: 400 });
    }

    // Normalize date comparison strategy to UTC midnight
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const startUtc = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0, 0, 0, 0));
    const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 0, 0, 0, 0));

    // Reject past dates
    if (startUtc < todayUtc) {
      return NextResponse.json({ error: "Booking start date cannot be in the past." }, { status: 400 });
    }

    // Reject non-forward durations (toDate must be strictly greater than fromDate)
    if (endUtc <= startUtc) {
      return NextResponse.json({ error: "End date must be later than start date." }, { status: 400 });
    }

    // Calculate totalDays on the server
    const diffMs = endUtc.getTime() - startUtc.getTime();
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) {
      return NextResponse.json({ error: "Booking duration must be at least 1 day." }, { status: 400 });
    }

    await dbConnect();

    // 4. Double check user verification status from DB
    const user = await User.findById(session.user.id).select("license");
    if (!user || user.license?.status !== "verified") {
      return NextResponse.json(
        { error: "Booking rejected. You must upload and verify your Driving License first." },
        { status: 403 }
      );
    }

    // 5. Load authoritative vehicle details (P0-2, P0-4, P0-7)
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
    }

    // Reject if authenticated user owns the vehicle (P0-7)
    if (vehicle.owner.toString() === session.user.id) {
      return NextResponse.json({ error: "You cannot book your own vehicle." }, { status: 400 });
    }

    // Reject if vehicle is not approved or not marked available (P0-4)
    if (vehicle.status !== "approved" || vehicle.availability !== true) {
      return NextResponse.json(
        { error: "Vehicle is currently unavailable for booking." },
        { status: 400 }
      );
    }

    // Check vehicle blocked dates intersection (P0-4)
    // Pickup date is inclusive, return date is exclusive: [startUtc, endUtc)
    if (vehicle.blockedDates && vehicle.blockedDates.length > 0) {
      const requestedDates = new Set<string>();
      let cursor = new Date(startUtc);
      while (cursor < endUtc) {
        requestedDates.add(cursor.toISOString().slice(0, 10));
        cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      }

      const isBlocked = vehicle.blockedDates.some((bDate: Date) => {
        const bStr = new Date(bDate).toISOString().slice(0, 10);
        return requestedDates.has(bStr);
      });

      if (isBlocked) {
        return NextResponse.json(
          { error: "The selected dates include dates blocked by the owner." },
          { status: 409 }
        );
      }
    }

    // 6. Server-side authoritative price calculation (P0-2)
    const authoritativePricePerDay = vehicle.pricePerDay;
    if (!authoritativePricePerDay || authoritativePricePerDay <= 0) {
      return NextResponse.json({ error: "Invalid vehicle daily pricing." }, { status: 500 });
    }
    const totalPrice = authoritativePricePerDay * totalDays;

    // 7. Overlapping booking check & Race condition safety (P0-5, P0-6)
    // Conflict condition (inclusive pickup, exclusive return):
    // Existing.fromDate < requested.toDate AND Existing.toDate > requested.fromDate
    // Considering only active states: pending, approved
    let createdBookingId: string | null = null;
    let handledByTransaction = false;

    // Attempt MongoDB transaction with write lock to serialize concurrent bookings
    let dbSession: mongoose.ClientSession | null = null;
    try {
      dbSession = await mongoose.startSession();
      await dbSession.withTransaction(async () => {
        // Concurrency write lock: update vehicle timestamp inside transaction to serialize writes on this vehicle
        const lockedVehicle = await Vehicle.findOneAndUpdate(
          { _id: vehicleId, status: "approved", availability: true },
          { $set: { updatedAt: new Date() } },
          { session: dbSession, new: true }
        );

        if (!lockedVehicle) {
          throw new Error("VEHICLE_UNAVAILABLE");
        }

        const conflict = await Booking.findOne({
          vehicle: vehicleId,
          status: { $in: ["pending", "approved"] },
          fromDate: { $lt: endUtc },
          toDate: { $gt: startUtc },
        }).session(dbSession);

        if (conflict) {
          throw new Error("BOOKING_CONFLICT");
        }

        const [newBooking] = await Booking.create(
          [
            {
              vehicle: vehicleId,
              user: session.user.id,
              fromDate: startUtc,
              toDate: endUtc,
              totalPrice,
              status: "pending",
            },
          ],
          { session: dbSession }
        );

        createdBookingId = newBooking._id.toString();
      });

      handledByTransaction = true;
    } catch (txnErr: unknown) {
      const errMessage = txnErr instanceof Error ? txnErr.message : String(txnErr);
      if (errMessage === "BOOKING_CONFLICT") {
        return NextResponse.json(
          { error: "Vehicle is already booked or has a pending reservation for the selected dates." },
          { status: 409 }
        );
      }
      if (errMessage === "VEHICLE_UNAVAILABLE") {
        return NextResponse.json(
          { error: "Vehicle is currently unavailable for booking." },
          { status: 400 }
        );
      }

      // Check if transactions are unsupported (e.g. standalone MongoDB deployment without replica set)
      const isReplicaSetError =
        errMessage.includes("replica set") ||
        errMessage.includes("Transaction numbers are only allowed on a replica set");

      if (!isReplicaSetError) {
        throw txnErr;
      }

      // Production Guard: Prevent silent non-transactional fallback in production
      if (process.env.NODE_ENV === "production") {
        console.error("FATAL: MongoDB replica set / Atlas deployment required for booking transactions in production.");
        return NextResponse.json(
          { error: "Server configuration error: MongoDB Atlas / replica set is required for booking transactions." },
          { status: 500 }
        );
      }

      console.warn("WARN: Standalone MongoDB detected. Falling back to non-transactional reservation check (Development only).");
    } finally {
      if (dbSession) {
        await dbSession.endSession();
      }
    }

    // Fallback for standalone / non-replica set MongoDB environments
    if (!handledByTransaction) {
      const conflict = await Booking.findOne({
        vehicle: vehicleId,
        status: { $in: ["pending", "approved"] },
        fromDate: { $lt: endUtc },
        toDate: { $gt: startUtc },
      });

      if (conflict) {
        return NextResponse.json(
          { error: "Vehicle is already booked or has a pending reservation for the selected dates." },
          { status: 409 }
        );
      }

      const newBooking = await Booking.create({
        vehicle: vehicleId,
        user: session.user.id,
        fromDate: startUtc,
        toDate: endUtc,
        totalPrice,
        status: "pending",
      });

      createdBookingId = newBooking._id.toString();
    }

    // 8. Return populated booking with authoritative calculation
    const populatedBooking = await Booking.findById(createdBookingId)
      .populate("vehicle", "title brand model pricePerDay location images")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Booking requested successfully!",
      booking: populatedBooking,
      totalDays,
      totalPrice,
    });
  } catch (error: unknown) {
    console.error("Booking error:", error);
    const message = error instanceof Error ? error.message : "Failed to create booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
