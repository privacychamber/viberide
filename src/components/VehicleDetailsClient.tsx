"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Fuel, Calendar, ShieldCheck, ShieldAlert, Users, Settings, MessageCircle, ArrowLeft } from "lucide-react";

export default function VehicleDetailsClient({
  vehicle,
  sessionUser,
  dbUserVerificationStatus,
}: {
  vehicle: any;
  sessionUser: any;
  dbUserVerificationStatus: string; // "none" | "pending" | "verified" | "rejected"
}) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Date calculation
  const calculateDays = () => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  };

  const days = calculateDays();
  const totalPrice = days * vehicle.pricePerDay;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }

    if (dbUserVerificationStatus !== "verified") {
      setError("You must have a verified Driving License to rent vehicles. Please upload details in Profile.");
      return;
    }

    if (!fromDate || !toDate) {
      setError("Please select both Pickup and Dropoff dates.");
      return;
    }

    if (days <= 0) {
      setError("Dropoff date must be after Pickup date.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Determine if offline/fallback vehicle
      const isFallback = vehicle._id.startsWith("fb_");

      if (isFallback) {
        // Mock flow using LocalStorage
        const mockBooking = {
          _id: "mock_bk_" + Math.random().toString(36).substr(2, 9),
          vehicle: {
            _id: vehicle._id,
            title: vehicle.title,
            brand: vehicle.brand,
            model: vehicle.model,
            pricePerDay: vehicle.pricePerDay,
            location: vehicle.location,
            images: vehicle.images,
          },
          fromDate,
          toDate,
          totalPrice,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        const existing = JSON.parse(localStorage.getItem("mock_bookings") || "[]");
        existing.push(mockBooking);
        localStorage.setItem("mock_bookings", JSON.stringify(existing));

        setTimeout(() => {
          setLoading(false);
          setSuccess(true);
          setBookingDetails(mockBooking);
        }, 1200);
      } else {
        // Real DB booking flow using API route
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle._id,
            fromDate,
            toDate,
            totalPrice,
          }),
        });

        const data = await response.json();
        setLoading(false);

        if (!response.ok) {
          throw new Error(data.error || "Failed to request booking");
        }

        setSuccess(true);
        setBookingDetails(data.booking);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "An unexpected error occurred.");
    }
  };

  const imageUrl = vehicle.images?.[0] || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
      {/* Back Link */}
      <Link href="/explore" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-sunset-orange mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visuals & Specifications */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Visual */}
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/25 border border-white/5 shadow-2xl">
            <img
              src={imageUrl}
              alt={vehicle.title}
              className="w-full h-full object-cover"
            />
            {/* Category tag */}
            <div className="absolute top-4 left-4 bg-mountain-black-light/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold tracking-widest text-sunset-orange uppercase border border-white/10">
              {vehicle.type}
            </div>
          </div>

          {/* Specs Details Card */}
          <div className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl space-y-6">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{vehicle.brand} • {vehicle.model}</p>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-snow-white">{vehicle.title}</h1>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-2">
                <MapPin className="w-4 h-4 text-forest-green-light" />
                <span>
                  Available at {typeof vehicle.location === 'string' 
                    ? vehicle.location 
                    : vehicle.location 
                      ? `${vehicle.location.area || 'Unknown'}, ${vehicle.location.city || 'Unknown'}`
                      : 'Unknown Location'}
                </span>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Spec grid */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Specifications</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {vehicle.specs?.transmission && (
                  <div className="bg-mountain-black border border-white/5 p-3 rounded-xl">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold">Transmission</span>
                    <span className="text-sm font-semibold text-snow-white">{vehicle.specs.transmission}</span>
                  </div>
                )}
                {vehicle.specs?.fuelType && (
                  <div className="bg-mountain-black border border-white/5 p-3 rounded-xl">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold">Fuel Type</span>
                    <span className="text-sm font-semibold text-snow-white flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      {vehicle.specs.fuelType}
                    </span>
                  </div>
                )}
                {vehicle.specs?.engineCc && (
                  <div className="bg-mountain-black border border-white/5 p-3 rounded-xl">
                    <span className="block text-[10px] text-gray-500 uppercase font-bold">Engine</span>
                    <span className="text-sm font-semibold text-snow-white">{vehicle.specs.engineCc} cc</span>
                  </div>
                )}
                <div className="bg-mountain-black border border-white/5 p-3 rounded-xl">
                  <span className="block text-[10px] text-gray-500 uppercase font-bold">Seating Capacity</span>
                  <span className="text-sm font-semibold text-snow-white flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    {vehicle.specs?.seatingCapacity || 2} Seater
                  </span>
                </div>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Platform Rules */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rental Rules & Policy</h3>
              <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                <li>Refundable Security Deposit of ₹1,000–₹3,000 depending on category.</li>
                <li>Original ID (Aadhaar/Passport) to be submitted physically during pickup.</li>
                <li>Fuel not included in charges. Vehicle is provided with minimum fuel to reach the nearest pump.</li>
                <li>Driving License must be presented in original at pickup.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Widget */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          
          {/* Booking State Display */}
          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-snow-white">Booking Requested!</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Your reservation is pending approval from the local owner. Once approved, you can complete payment.
                </p>
              </div>

              <div className="bg-mountain-black border border-white/5 p-4 rounded-xl text-left space-y-1.5 text-xs text-gray-400">
                <div className="flex justify-between"><span className="font-medium text-gray-500">Booking ID:</span><span className="font-mono text-snow-white">{bookingDetails?._id}</span></div>
                <div className="flex justify-between"><span className="font-medium text-gray-500">From Date:</span><span className="text-snow-white">{fromDate}</span></div>
                <div className="flex justify-between"><span className="font-medium text-gray-500">To Date:</span><span className="text-snow-white">{toDate}</span></div>
                <div className="flex justify-between border-t border-white/5 pt-2"><span className="font-bold text-gray-400">Total Price:</span><span className="font-bold text-emerald-400 text-sm">₹{totalPrice}</span></div>
              </div>

              <a
                href={`https://wa.me/918888888888?text=Hi%20there,%20I've%20just%20requested%20a%20booking%20for%20the%20${vehicle.title}%20from%20${fromDate}%20to%20${toDate}.%20Please%20verify%20and%20approve.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20ba56] text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Owner via WhatsApp
              </a>

              <Link
                href="/bookings"
                className="block text-xs font-semibold text-gray-400 hover:text-sunset-orange transition-colors"
              >
                View My Booking History
              </Link>
            </div>
          ) : (
            <div className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <span className="font-heading font-extrabold text-2xl text-snow-white">₹{vehicle.pricePerDay}</span>
                  <span className="text-gray-400 text-xs"> / day</span>
                </div>
                <span className="text-[10px] text-forest-green-light font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Listing
                </span>
              </div>

              <hr className="border-white/5" />

              {/* Verification Alert Banner */}
              {sessionUser && dbUserVerificationStatus !== "verified" && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 text-amber-300">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold mb-1">License Verification Required</p>
                    <p className="mb-2 text-gray-400">You must upload your Driving License for review before you can book.</p>
                    <Link href="/profile" className="underline font-bold text-snow-white hover:text-sunset-orange transition-colors">
                      Go to Verification Center →
                    </Link>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Pickup Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={fromDate}
                        onChange={(e) => {
                          const date = e.target.value;
                          const isBlocked = vehicle.blockedDates?.some((d: string) => d.startsWith(date));
                          if (isBlocked) {
                            setError("This pickup date is unavailable (blocked by owner).");
                            setFromDate("");
                          } else {
                            setError("");
                            setFromDate(date);
                          }
                        }}
                        className="w-full bg-mountain-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-snow-white focus:outline-none focus:border-forest-green-light focus:ring-0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Dropoff Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        min={fromDate || new Date().toISOString().split("T")[0]}
                        value={toDate}
                        onChange={(e) => {
                          const date = e.target.value;
                          const isBlocked = vehicle.blockedDates?.some((d: string) => d.startsWith(date));
                          if (isBlocked) {
                            setError("This dropoff date is unavailable (blocked by owner).");
                            setToDate("");
                          } else {
                            setError("");
                            setToDate(date);
                          }
                        }}
                        className="w-full bg-mountain-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-snow-white focus:outline-none focus:border-forest-green-light focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-rose-400 font-medium bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 leading-relaxed">
                    {error}
                  </p>
                )}

                {days > 0 && (
                  <div className="bg-mountain-black border border-white/5 p-4 rounded-xl space-y-2 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>₹{vehicle.pricePerDay} × {days} days</span>
                      <span>₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Security Deposit (Refundable)</span>
                      <span>₹1,500</span>
                    </div>
                    <hr className="border-white/5" />
                    <div className="flex justify-between font-bold text-snow-white">
                      <span>Total Amount</span>
                      <span className="text-emerald-400 font-extrabold text-sm">₹{totalPrice}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (sessionUser && dbUserVerificationStatus !== "verified")}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold shadow-md hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    sessionUser && dbUserVerificationStatus !== "verified"
                      ? "bg-white/10 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-sunset-orange to-sunset-orange-dark hover:from-sunset-orange-dark hover:to-sunset-orange text-white"
                  }`}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : sessionUser ? (
                    dbUserVerificationStatus === "verified" ? (
                      "Request Booking"
                    ) : (
                      "Upload DL to Rent"
                    )
                  ) : (
                    "Login to Book"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
