import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import VehicleDetailsClient from "@/components/VehicleDetailsClient";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";
import User from "@/models/User";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

const FALLBACK_VEHICLES = [
  {
    _id: "fb_himalayan",
    title: "Royal Enfield Himalayan 450",
    type: "bike",
    brand: "Royal Enfield",
    model: "Himalayan 450",
    pricePerDay: 1800,
    location: "McLeod Ganj",
    images: ["https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 450, fuelType: "Petrol", transmission: "Geared", seatingCapacity: 2, deliveryAvailable: true }
  },
  {
    _id: "fb_activa",
    title: "Honda Activa 6G (Matte Grey)",
    type: "scooter",
    brand: "Honda",
    model: "Activa 6G",
    pricePerDay: 450,
    location: "Bir Colony",
    images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 110, fuelType: "Petrol", transmission: "Non-Geared", seatingCapacity: 2, deliveryAvailable: true }
  },
  {
    _id: "fb_thar",
    title: "Mahindra Thar 4x4 (Hard Top)",
    type: "car",
    brand: "Mahindra",
    model: "Thar 4x4",
    pricePerDay: 3500,
    location: "Landing Site",
    images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 2184, fuelType: "Diesel", transmission: "Manual", seatingCapacity: 4, deliveryAvailable: true }
  },
  {
    _id: "fb_ktm",
    title: "KTM Duke 390",
    type: "bike",
    brand: "KTM",
    model: "Duke 390",
    pricePerDay: 2200,
    location: "Bhagsu",
    images: ["https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 373, fuelType: "Petrol", transmission: "Geared", seatingCapacity: 2, deliveryAvailable: false }
  },
  {
    _id: "fb_access",
    title: "Suzuki Access 125 SE",
    type: "scooter",
    brand: "Suzuki",
    model: "Access 125",
    pricePerDay: 500,
    location: "Dharamkot",
    images: ["https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 124, fuelType: "Petrol", transmission: "Non-Geared", seatingCapacity: 2, deliveryAvailable: true }
  },
  {
    _id: "fb_ather",
    title: "Ather 450X Gen 3 (Electric)",
    type: "scooter",
    brand: "Ather",
    model: "450X",
    pricePerDay: 700,
    location: "Bir Colony",
    images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80"],
    specs: { fuelType: "Electric", transmission: "Automatic", seatingCapacity: 2, deliveryAvailable: true }
  }
];

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VehicleDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Retrieve user session
  const session = await auth();

  let vehicle: any = null;
  let dbUserVerificationStatus = "none";

  // Check if target is a fallback item
  const fallbackMatch = FALLBACK_VEHICLES.find(v => v._id === id);

  if (fallbackMatch) {
    vehicle = fallbackMatch;
  } else {
    try {
      await dbConnect();
      const dbVehicle = await Vehicle.findById(id).lean();
      if (dbVehicle) {
        vehicle = {
          ...dbVehicle,
          _id: dbVehicle._id.toString(),
          owner: dbVehicle.owner.toString(),
          createdAt: undefined,
          updatedAt: undefined
        };
      }
    } catch (error) {
      console.error("Failed to fetch vehicle details from database:", error);
    }
  }

  // If vehicle still not found, return Next.js notFound
  if (!vehicle) {
    notFound();
  }

  // Fetch verified status from DB if logged in
  if (session?.user) {
    try {
      await dbConnect();
      const user = await User.findById(session.user.id).select("license").lean();
      if (user) {
        dbUserVerificationStatus = user.license?.status || "none";
      }
    } catch (error) {
      console.error("Failed to fetch user verification status:", error);
      // Fallback: If DB query fails, read session verified state
      dbUserVerificationStatus = session.user.verified ? "verified" : "none";
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0 animate-fade-in">
      <Navbar />

      <VehicleDetailsClient
        vehicle={vehicle}
        sessionUser={session?.user || null}
        dbUserVerificationStatus={dbUserVerificationStatus}
      />

      <BottomNav />
    </div>
  );
}
