import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

// Inline schema definitions to allow standalone execution without Next.js aliases
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ["renter", "owner", "admin"], default: "renter" },
    license: {
      frontUrl: { type: String },
      backUrl: { type: String },
      status: { type: String, enum: ["none", "pending", "verified", "rejected"], default: "none" },
    },
    selfieUrl: { type: String },
    verified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    wishlist: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }], default: [] },
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const VehicleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["scooter", "bike", "car"], required: true },
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
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    availability: { type: Boolean, default: true },
    blockedDates: { type: [Date], default: [] },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    featured: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    documents: { rcUrl: { type: String }, insuranceUrl: { type: String } },
    specs: {
      engineCc: { type: Number },
      fuelType: { type: String, enum: ["Petrol", "Diesel", "Electric"], default: "Petrol" },
      transmission: { type: String, enum: ["Manual", "Automatic", "Geared", "Non-Geared"], default: "Manual" },
      seatingCapacity: { type: Number, default: 2 },
      deliveryAvailable: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const BookingSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", VehicleSchema);
const Booking = mongoose.models.Booking || mongoose.model("Booking", BookingSchema);

async function seed() {
  console.log("🌱 Connecting to database...");
  await mongoose.connect(MONGODB_URI as string);

  console.log("⚠️ Clearing existing development seed data...");
  await User.deleteMany({});
  await Vehicle.deleteMany({});
  await Booking.deleteMany({});

  console.log("👥 Creating users...");
  const admin = await User.create({
    name: "Admin Officer",
    phone: "9999999999",
    role: "admin",
    verified: true,
    emailVerified: true,
    license: { status: "verified" },
  });

  const owner1 = await User.create({
    name: "Amit Sharma (Dharamshala Rentals)",
    phone: "8888888888",
    role: "owner",
    verified: true,
    emailVerified: true,
    license: { status: "verified" },
  });

  const owner2 = await User.create({
    name: "Bir Adventure Wheels",
    phone: "7777777777",
    role: "owner",
    verified: true,
    emailVerified: true,
    license: { status: "verified" },
  });

  await User.create({
    name: "Rahul Nomad",
    phone: "6666666666",
    role: "renter",
    verified: true,
    emailVerified: true,
    license: {
      frontUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
      backUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
      status: "verified",
    },
  });

  console.log("🚗 Creating sample vehicles...");
  const vehiclesData = [
    {
      title: "Royal Enfield Himalayan 450",
      type: "bike",
      brand: "Royal Enfield",
      model: "Himalayan 450",
      pricePerDay: 1800,
      location: {
        area: "McLeod Ganj",
        city: "Dharamshala",
        state: "Himachal Pradesh",
        country: "India",
      },
      images: [
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=800&q=80",
      ],
      owner: owner1._id,
      availability: true,
      status: "approved",
      featured: true,
      documents: {
        rcUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        insuranceUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
      },
      specs: {
        engineCc: 450,
        fuelType: "Petrol",
        transmission: "Geared",
        seatingCapacity: 2,
        deliveryAvailable: true,
      },
    },
    {
      title: "Honda Activa 6G (Matte Grey)",
      type: "scooter",
      brand: "Honda",
      model: "Activa 6G",
      pricePerDay: 450,
      location: {
        area: "Bir Colony",
        city: "Bir",
        state: "Himachal Pradesh",
        country: "India",
      },
      images: [
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
      ],
      owner: owner2._id,
      availability: true,
      status: "approved",
      featured: true,
      documents: {
        rcUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        insuranceUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
      },
      specs: {
        engineCc: 110,
        fuelType: "Petrol",
        transmission: "Non-Geared",
        seatingCapacity: 2,
        deliveryAvailable: true,
      },
    },
    {
      title: "Mahindra Thar 4x4 (Hard Top)",
      type: "car",
      brand: "Mahindra",
      model: "Thar 4x4",
      pricePerDay: 3500,
      location: {
        area: "Landing Site",
        city: "Bir",
        state: "Himachal Pradesh",
        country: "India",
      },
      images: [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
      ],
      owner: owner2._id,
      availability: true,
      status: "approved",
      featured: true,
      documents: {
        rcUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        insuranceUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
      },
      specs: {
        engineCc: 2184,
        fuelType: "Diesel",
        transmission: "Manual",
        seatingCapacity: 4,
        deliveryAvailable: true,
      },
    },
  ];

  await Vehicle.create(vehiclesData);
  console.log("✅ Seed complete! Successfully added sample users and vehicles.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
