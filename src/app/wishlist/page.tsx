"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import VehicleCard from "@/components/VehicleCard";
import { Heart, Compass } from "lucide-react";
import Link from "next/link";

export default function WishlistPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<any[]>([]);

  // Auto redirect if not logged in
  useEffect(() => {
    if (session === null) {
      router.push("/login?callbackUrl=/wishlist");
    }
  }, [session, router]);

  const loadWishlist = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.user.wishlist || []);
        
        // Update local cache to match database
        const ids = (data.user.wishlist || []).map((v: any) => v._id);
        localStorage.setItem("viberide_wishlist", JSON.stringify(ids));
      }
    } catch (error) {
      console.error("Failed to load wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadWishlist();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-mountain-black flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
      <Navbar />

      <div className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-snow-white flex items-center gap-2">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            <span>My Wishlist</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Your saved scooters, bikes, and cars for quick access.</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <span className="w-8 h-8 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin inline-block" />
          </div>
        ) : wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-mountain-black-light/30 border border-dashed border-white/5 rounded-2xl">
            <Heart className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-sm text-gray-400 mb-2">Your wishlist is empty.</p>
            <p className="text-xs text-gray-600 mb-6">Tap the heart icon on any vehicle card to save it for later.</p>
            <Link
              href="/explore"
              className="bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-snow-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
            >
              Explore Vehicles
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
