"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Fuel, ShieldAlert, Zap, Compass } from "lucide-react";

export interface VehicleProp {
  _id: string;
  title: string;
  type: "scooter" | "bike" | "car";
  brand: string;
  model: string;
  pricePerDay: number;
  location: string;
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
        {/* Delivery Badge */}
        {vehicle.specs.deliveryAvailable && (
          <div className="absolute top-3 right-3 bg-forest-green-dark/95 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-full text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
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
          <span>{vehicle.location}</span>
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
