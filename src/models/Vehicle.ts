import mongoose, { Schema, Model } from "mongoose";

export interface IVehicle {
  title: string;
  type: "scooter" | "bike" | "car";
  brand: string;
  model: string;
  pricePerDay: number;
  location: {
    area: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
  };
  images: string[];
  owner: mongoose.Types.ObjectId;
  availability: boolean;
  blockedDates: Date[];
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  flagged: boolean;
  documents?: {
    rcUrl?: string;
    insuranceUrl?: string;
  };
  specs: {
    engineCc?: number;
    fuelType?: "Petrol" | "Diesel" | "Electric";
    transmission?: "Manual" | "Automatic" | "Geared" | "Non-Geared";
    seatingCapacity?: number;
    deliveryAvailable?: boolean;
  };
  createdAt: Date;
}

const VehicleSchema: Schema<IVehicle> = new Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["scooter", "bike", "car"],
      required: true,
    },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    pricePerDay: { type: Number, required: true },
    location: {
      area: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true, default: "Himachal Pradesh" },
      country: { type: String, required: true, default: "India" },
      pincode: { type: String },
    },
    images: { type: [String], default: [] },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    availability: { type: Boolean, default: true },
    blockedDates: { type: [Date], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    featured: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    documents: {
      rcUrl: { type: String, default: "" },
      insuranceUrl: { type: String, default: "" },
    },
    specs: {
      engineCc: { type: Number },
      fuelType: {
        type: String,
        enum: ["Petrol", "Diesel", "Electric"],
        default: "Petrol",
      },
      transmission: {
        type: String,
        enum: ["Manual", "Automatic", "Geared", "Non-Geared"],
        default: "Manual",
      },
      seatingCapacity: { type: Number, default: 2 },
      deliveryAvailable: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const Vehicle: Model<IVehicle> =
  mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);

export default Vehicle;
