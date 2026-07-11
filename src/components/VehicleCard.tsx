"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MapPin, Fuel, ShieldAlert, Zap, Compass, Heart } from "lucide-react";

export interface VehicleProp {
  _id: string;
  title: string;
  type: "scooter" | "bike" | "car";
  brand: string;
  model: string;
  pricePerDay: number;
  location: { area: string; city: string; state: string; country: string; } | string | any;
  images: string[];
  specs: {
    engineCc?: number;
    fuelType?: string;
    transmission?: string;
    seatingCapacity?: number;
    deliveryAvailable?: boolean;
  };
}

export default function VehicleCard({ vehicle }: { vehicle: VehicleProp }) {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Read from localStorage cache for instant UI feedback
    const cache = JSON.parse(localStorage.getItem("viberide_wishlist") || "[]");
    setSaved(cache.includes(vehicle._id));
  }, [vehicle._id]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      alert("Please log in to save vehicles to your wishlist.");
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${vehicle._id}/wishlist`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(data.isSaved);
        const cache = JSON.parse(localStorage.getItem("viberide_wishlist") || "[]");
        if (data.isSaved) {
          if (!cache.includes(vehicle._id)) cache.push(vehicle._id);
        } else {
          const idx = cache.indexOf(vehicle._id);
          if (idx > -1) cache.splice(idx, 1);
        }
        localStorage.setItem("viberide_wishlist", JSON.stringify(cache));
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);
    }
  };

  // Use a default image if no images are provided
  const imageUrl =
    vehicle.images && vehicle.images.length > 0
      ? vehicle.images[0]
      : "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80"; // Unsplash bike placeholder

  return (
    <div className="group bg-mountain-black-light rounded-2xl overflow-hidden border border-white/5 hover:border-forest-green/50 transition-all duration-300 flex flex-col h-full shadow-lg shadow-black/45">
      {/* Vehicle Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/20">
        <img
          src={imageUrl}
          alt={vehicle.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-mountain-black/80 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full text-sunset-orange border border-white/10">
          {vehicle.type}
        </div>
        {/* Wishlist Heart Icon */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-mountain-black/80 backdrop-blur-md border border-white/10 text-gray-400 hover:text-rose-500 hover:scale-110 transition-all cursor-pointer z-10"
          title={saved ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>
        {/* Delivery Badge */}
        {vehicle.specs.deliveryAvailable && (
          <div className="absolute bottom-3 left-3 bg-forest-green-dark/95 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-full text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Delivery
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Title and Brand */}
        <div className="mb-2">
          <p className="text-xs text-gray-400 font-semibold tracking-wide uppercase">
            {vehicle.brand} • {vehicle.model}
          </p>
          <h3 className="font-heading font-bold text-lg text-snow-white group-hover:text-sunset-orange transition-colors">
            {vehicle.title}
          </h3>
        </div>

        {/* Location Info */}
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-4">
          <MapPin className="w-3.5 h-3.5 text-forest-green-light" />
          <span>
            {typeof vehicle.location === 'string' 
              ? vehicle.location 
              : vehicle.location 
                ? `${vehicle.location.area || 'Unknown'}, ${vehicle.location.city || 'Unknown'}`
                : 'Location Unknown'}
          </span>
        </div>

        {/* Spec Tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {vehicle.specs.transmission && (
            <span className="text-[10px] bg-white/5 border border-white/5 text-gray-300 px-2 py-0.5 rounded">
              {vehicle.specs.transmission}
            </span>
          )}
          {vehicle.specs.fuelType && (
            <span className="text-[10px] bg-white/5 border border-white/5 text-gray-300 px-2 py-0.5 rounded flex items-center gap-1">
              <Fuel className="w-2.5 h-2.5 text-amber-500" />
              {vehicle.specs.fuelType}
            </span>
          )}
          {vehicle.specs.engineCc && (
            <span className="text-[10px] bg-white/5 border border-white/5 text-gray-300 px-2 py-0.5 rounded">
              {vehicle.specs.engineCc} cc
            </span>
          )}
        </div>

        {/* Pricing and Action */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <span className="font-heading font-extrabold text-lg text-snow-white">
              ₹{vehicle.pricePerDay}
            </span>
            <span className="text-gray-400 text-xs"> / day</span>
          </div>
          <Link
            href={`/vehicles/${vehicle._id}`}
            className="bg-forest-green-light hover:bg-sunset-orange text-snow-white hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
