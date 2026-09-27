"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import VehicleDetailsClient from "@/components/VehicleDetailsClient";
import { useSession } from "@/context/AuthContext";

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

export default function VehicleDetailsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { data: session } = useSession();

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fallbackMatch = FALLBACK_VEHICLES.find(v => v._id === id);
    if (fallbackMatch) {
      setVehicle(fallbackMatch);
      setLoading(false);
    } else {
      fetch(`/api/vehicles`)
        .then(res => res.json())
        .then(data => {
          const v = data.find((v: any) => v.id === id || v.id === parseInt(id));
          if (v) {
            setVehicle({
              ...v,
              _id: v.id,
              owner: v.owner_id
            });
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  const dbUserVerificationStatus = session?.user?.verified ? "verified" : "none";

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Vehicle Not Found</h2>
          <p className="text-gray-400">The vehicle you are looking for does not exist or has been removed.</p>
        </div>
        <BottomNav />
      </div>
    );
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
