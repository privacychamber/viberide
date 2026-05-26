"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Calendar, MapPin, MessageSquare, Clock, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";
import Link from "next/link";

export default function BookingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [mockBookings, setMockBookings] = useState<any[]>([]);

  // Auto redirect if not logged in
  useEffect(() => {
    if (session === null) {
      router.push("/login?callbackUrl=/bookings");
    }
  }, [session, router]);

  const loadBookings = async () => {
    if (!session?.user?.id) return;
    setLoading(true);

    // Fetch local mock bookings
    const localBk = JSON.parse(localStorage.getItem("mock_bookings") || "[]");
    setMockBookings(localBk);

    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setDbBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Failed to load bookings from database:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadBookings();
    }
  }, [session]);

  const deleteMockBooking = (id: string) => {
    const filtered = mockBookings.filter((b) => b._id !== id);
    localStorage.setItem("mock_bookings", JSON.stringify(filtered));
    setMockBookings(filtered);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-mountain-black flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allBookings = [...dbBookings, ...mockBookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
      <Navbar />

      <div className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-snow-white">My Trips & Bookings</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track your rental status and connect with vehicle hosts.</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <span className="w-8 h-8 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin inline-block" />
          </div>
        ) : allBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allBookings.map((booking) => {
              const isMock = booking._id.startsWith("mock_");
              const vehicle = booking.vehicle;
              const status = booking.status;

              return (
                <div key={booking._id} className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl flex flex-col h-full shadow-lg">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {vehicle.brand} • {vehicle.model}
                      </span>
                      <h3 className="font-heading font-bold text-base text-snow-white mt-0.5">
                        {vehicle.title}
                      </h3>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      status === "approved"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : status === "rejected"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                    }`}>
                      {status.toUpperCase()}
                    </span>
                  </div>

                  {/* Booking details */}
                  <div className="space-y-2 text-xs text-gray-400 mb-4 bg-mountain-black p-3.5 rounded-xl border border-white/5">
                    <div className="flex justify-between">
                      <span>Pickup:</span>
                      <span className="text-snow-white font-semibold">{new Date(booking.fromDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dropoff:</span>
                      <span className="text-snow-white font-semibold">{new Date(booking.toDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-1.5">
                      <span>Paid Amount:</span>
                      <span className="text-emerald-400 font-bold">₹{booking.totalPrice}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 pt-1">
                      <MapPin className="w-3 h-3 text-forest-green-light" />
                      <span>Pickup Zone: {vehicle.location}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                    {status === "approved" ? (
                      <a
                        href={`https://wa.me/918888888888?text=Hi,%20my%20booking%20ID%20is%20${booking._id}%20for%20the%20${vehicle.title}.%20Where%20should%20we%20meet%20for%20pickup?`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#25D366] hover:bg-[#20ba56] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat with Host
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic">WhatsApp unlock button will appear upon host approval</span>
                    )}

                    {isMock && (
                      <button
                        onClick={() => deleteMockBooking(booking._id)}
                        className="p-2.5 bg-white/5 border border-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                        title="Cancel/Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-mountain-black-light/30 border border-dashed border-white/5 rounded-2xl">
            <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-sm text-gray-400 mb-2">You don't have any bookings yet.</p>
            <p className="text-xs text-gray-600 mb-6">Explore vehicles available in McLeod Ganj and Bir Billing to request your first ride.</p>
            <Link
              href="/explore"
              className="bg-gradient-to-r from-sunset-orange to-sunset-orange-dark text-snow-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
            >
              Explore Fleet
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
