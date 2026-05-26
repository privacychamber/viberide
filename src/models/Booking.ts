import mongoose, { Schema, Model } from "mongoose";

export interface IBooking {
  vehicle: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  fromDate: Date;
  toDate: Date;
  totalPrice: number;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  createdAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
