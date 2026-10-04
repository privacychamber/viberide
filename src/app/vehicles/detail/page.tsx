"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import VehicleDetailsClient from "@/components/VehicleDetailsClient";
import { useSession } from "@/context/AuthContext";

export default function VehicleDetailsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { data: session } = useSession();

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/vehicles/detail.php?id=${id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Vehicle not found");
        }
        return res.json();
      })
      .then(data => {
        setVehicle(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setVehicle(null);
        setLoading(false);
      });
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
