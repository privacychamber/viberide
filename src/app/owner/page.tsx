"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Plus, Check, X, ShieldAlert, Award, TrendingUp, Calendar, Trash2, MapPin, Sparkles, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function OwnerDashboard() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  // Host activation states
  const [activating, setActivating] = useState(false);

  // Form states for adding vehicle
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("scooter");
  const [pricePerDay, setPricePerDay] = useState("");
  const [location, setLocation] = useState("Bir Colony");
  const [engineCc, setEngineCc] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");
  const [transmission, setTransmission] = useState("Non-Geared");
  const [seatingCapacity, setSeatingCapacity] = useState("2");
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const [addingVehicle, setAddingVehicle] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Dashboard data states
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);

  // Auto redirect if not logged in
  useEffect(() => {
    if (session === null) {
      router.push("/login?callbackUrl=/owner");
    }
  }, [session, router]);

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;
    setLoadingDashboard(true);
    try {
      const res = await fetch("/api/owner");
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
        setBookings(data.bookings || []);
        setEarnings(data.earnings || 0);
      }
    } catch (error) {
      console.error("Failed to load owner data:", error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id && session.user.role === "owner") {
      fetchDashboardData();
    } else {
      setLoadingDashboard(false);
    }
  }, [session]);

  const handleBecomeHost = async () => {
    setActivating(true);
    try {
      const res = await fetch("/api/owner/activate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Update next-auth session user role
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            role: "owner",
          },
        });
        window.location.reload();
      }
    } catch (error) {
      console.error("Host activation failed:", error);
    } finally {
      setActivating(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingVehicle(true);
    setAddSuccess(false);

    try {
      const payload = {
        title,
        brand,
        model,
        type,
        pricePerDay: Number(pricePerDay),
        location,
        specs: {
          engineCc: Number(engineCc) || undefined,
          fuelType,
          transmission,
          seatingCapacity: Number(seatingCapacity),
          deliveryAvailable,
        },
        images: imageUrl ? [imageUrl] : [],
      };

      const res = await fetch("/api/owner/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to add vehicle");
      }

      setAddSuccess(true);
      // Reset form fields
      setTitle("");
      setBrand("");
      setModel("");
      setPricePerDay("");
      setEngineCc("");
      setImageUrl("");

      await fetchDashboardData();
    } catch (error) {
      console.error("Error adding vehicle:", error);
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleBookingAction = async (bookingId: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/owner/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error("Failed to update booking status:", error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-mountain-black flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isOwner = session.user.role === "owner" || session.user.role === "admin";

  // Renter role landing page to become host
  if (!isOwner) {
    return (
      <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
        <Navbar />
        <div className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-8 py-16 flex flex-col items-center justify-center text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-forest-green/10 border border-forest-green-light/20 flex items-center justify-center text-sunset-orange text-4xl animate-bounce">
            💰
          </div>
          <div className="max-w-xl space-y-4">
            <h1 className="font-heading font-black text-3xl sm:text-4xl text-snow-white">
              Rent Out Your Vehicle & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset-orange via-amber-500 to-emerald-400">
                Earn Passive Income
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Earn between ₹15,000–₹60,000/mo by listing your scooter, bike, or car on Viberide. Connect with tourists, nomads, and paragliders visiting Dharamshala and Bir Billing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl py-6">
            <div className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl">
              <span className="block text-2xl mb-2">📈</span>
              <span className="block text-sm font-bold text-snow-white">Set Your Pricing</span>
              <span className="block text-xs text-gray-500 mt-1">Full control over daily rates & block dates.</span>
            </div>
            <div className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl">
              <span className="block text-2xl mb-2">🛡️</span>
              <span className="block text-sm font-bold text-snow-white">Secure KYC</span>
              <span className="block text-xs text-gray-500 mt-1">We verify renter driving licenses first.</span>
            </div>
            <div className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl">
              <span className="block text-2xl mb-2">🤝</span>
              <span className="block text-sm font-bold text-snow-white">Low Commission</span>
              <span className="block text-xs text-gray-500 mt-1">Keep 85%–95% of your earnings.</span>
            </div>
          </div>

          <button
            onClick={handleBecomeHost}
            disabled={activating}
            className="bg-gradient-to-r from-sunset-orange to-sunset-orange-dark px-8 py-3.5 rounded-xl font-bold text-sm hover:scale-105 shadow-xl shadow-sunset-orange/10 transition-all cursor-pointer flex items-center gap-2"
          >
            {activating ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Activate Host Account
              </>
            )}
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === "pending");

  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
      <Navbar />

      <div className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-snow-white">Host Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage your rental fleet and track earnings.</p>
          </div>
        </div>

        {/* Dashboard Metrics */}
        {loadingDashboard ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Metric 1 */}
            <div className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <span className="block text-xs font-bold uppercase text-gray-500">Active Listings</span>
                <span className="block font-heading font-black text-3xl text-snow-white mt-1">{vehicles.length}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-forest-green/10 text-forest-green-light flex items-center justify-center font-bold">🛵</div>
            </div>

            {/* Metric 2 */}
            <div className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <span className="block text-xs font-bold uppercase text-gray-500">Total Payouts</span>
                <span className="block font-heading font-black text-3xl text-emerald-400 mt-1">₹{earnings}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
            </div>

            {/* Metric 3 */}
            <div className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <span className="block text-xs font-bold uppercase text-gray-500">Pending Approvals</span>
                <span className="block font-heading font-black text-3xl text-amber-400 mt-1">{pendingBookings.length}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main List Column (Vehicles & Bookings) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Booking Requests Queue */}
            <section className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
              <h2 className="font-heading font-extrabold text-lg text-snow-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sunset-orange" />
                <span>Booking Requests ({pendingBookings.length})</span>
              </h2>

              {loadingDashboard ? (
                <div className="space-y-4">
                  {[1, 2].map((n) => (
                    <div key={n} className="bg-mountain-black border border-white/5 p-4 rounded-xl h-24 animate-pulse" />
                  ))}
                </div>
              ) : pendingBookings.length > 0 ? (
                <div className="space-y-4">
                  {pendingBookings.map((booking) => (
                    <div key={booking._id} className="bg-mountain-black border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded font-mono">{booking.vehicle.title}</span>
                        <div className="text-xs text-gray-400 mt-2 space-y-1">
                          <p><strong className="text-snow-white">Renter:</strong> {booking.user.name} ({booking.user.phone})</p>
                          <p><strong className="text-snow-white">Dates:</strong> {new Date(booking.fromDate).toLocaleDateString()} to {new Date(booking.toDate).toLocaleDateString()}</p>
                          <p><strong className="text-snow-white">Total Payout:</strong> <span className="text-emerald-400 font-bold">₹{booking.totalPrice}</span></p>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-2 w-full sm:w-auto shrink-0">
                        <button
                          onClick={() => handleBookingAction(booking._id, "approved")}
                          className="flex-1 sm:flex-none bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleBookingAction(booking._id, "rejected")}
                          className="flex-1 sm:flex-none bg-rose-500/10 border border-rose-500/25 text-rose-400 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-500 border border-dashed border-white/5 rounded-xl">
                  No pending booking requests. Approved bookings appear in trips history.
                </div>
              )}
            </section>

            {/* My Active Listings */}
            <section className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
              <h2 className="font-heading font-extrabold text-lg text-snow-white flex items-center gap-2">
                <span>My Active Listings ({vehicles.length})</span>
              </h2>

              {loadingDashboard ? (
                <div className="space-y-4">
                  {[1, 2].map((n) => (
                    <div key={n} className="bg-mountain-black border border-white/5 p-4 rounded-xl h-16 animate-pulse" />
                  ))}
                </div>
              ) : vehicles.length > 0 ? (
                <div className="space-y-3">
                  {vehicles.map((v) => (
                    <div key={v._id} className="bg-mountain-black border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded bg-black/25 overflow-hidden shrink-0 border border-white/5">
                          <img src={v.images?.[0] || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=150&q=80"} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-snow-white">{v.title}</h4>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-forest-green-light" />
                            {v.location} • ₹{v.pricePerDay}/day
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-gray-500 border border-dashed border-white/5 rounded-xl">
                  You haven't listed any vehicles yet. Fill out the form to add one.
                </div>
              )}
            </section>

          </div>

          {/* Right Column: Add Vehicle Widget */}
          <div className="lg:col-span-4 bg-mountain-black-light border border-white/5 p-6 rounded-2xl shadow-xl space-y-6 lg:sticky lg:top-24">
            <div>
              <h2 className="font-heading font-extrabold text-lg text-snow-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sunset-orange" />
                <span>Add Vehicle</span>
              </h2>
              <p className="text-[10px] text-gray-500 mt-1">Publish a scooter, motorcycle, or car for rent.</p>
            </div>

            {addSuccess && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                Listing added successfully!
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RE Himalayan 450 (White)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-mountain-black border border-white/10 rounded-lg px-2.5 py-2 text-snow-white focus:outline-none focus:border-sunset-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Enfield"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-mountain-black border border-white/10 rounded-lg px-2.5 py-2 text-snow-white focus:outline-none focus:border-sunset-orange"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Himalayan"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-mountain-black border border-white/10 rounded-lg px-2.5 py-2 text-snow-white focus:outline-none focus:border-sunset-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      if (e.target.value === "scooter") {
                        setTransmission("Non-Geared");
                        setSeatingCapacity("2");
                      } else if (e.target.value === "bike") {
                        setTransmission("Geared");
                        setSeatingCapacity("2");
                      } else {
                        setTransmission("Manual");
                        setSeatingCapacity("5");
                      }
                    }}
                    className="w-full bg-mountain-black border border-white/10 rounded-lg px-2.5 py-2 text-snow-white focus:outline-none focus:border-sunset-orange"
                  >
                    <option value="scooter">Scooter</option>
                    <option value="bike">Motorbike</option>
                    <option value="car">Car / SUV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rate (₹/day)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    className="w-full bg-mountain-black border border-white/10 rounded-lg px-2.5 py-2 text-snow-white focus:outline-none focus:border-sunset-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-mountain-black border border-white/10 rounded-lg px-2.5 py-2 text-snow-white focus:outline-none focus:border-sunset-orange"
                  >
                    <option value="McLeod Ganj">McLeod Ganj</option>
                    <option value="Bhagsu">Bhagsu</option>
                    <option value="Dharamkot">Dharamkot</option>
                    <option value="Bir Colony">Bir Colony</option>
                    <option value="Landing Site">Landing Site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full bg-mountain-black border border-white/10 rounded-lg px-2.5 py-2 text-snow-white focus:outline-none focus:border-sunset-orange"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full bg-mountain-black border border-white/10 rounded-lg px-2.5 py-2 text-snow-white focus:outline-none focus:border-sunset-orange"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Geared">Geared</option>
                    <option value="Non-Geared">Non-Geared</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Engine Size (cc)</label>
                  <input
                    type="number"
                    placeholder="e.g. 350 (optional)"
                    value={engineCc}
                    onChange={(e) => setEngineCc(e.target.value)}
                    className="w-full bg-mountain-black border border-white/10 rounded-lg px-2.5 py-2 text-snow-white focus:outline-none focus:border-sunset-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="Paste Unsplash or image link"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-mountain-black border border-white/10 rounded-lg px-2.5 py-2 text-snow-white focus:outline-none focus:border-sunset-orange"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-bold uppercase text-gray-500">Delivery Available</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryAvailable}
                    onChange={(e) => setDeliveryAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest-green-light peer-checked:after:bg-snow-white" />
                </label>
              </div>

              <button
                type="submit"
                disabled={addingVehicle}
                className="w-full py-3 bg-gradient-to-r from-forest-green-light to-forest-green hover:from-sunset-orange hover:to-sunset-orange-dark text-snow-white font-bold rounded-lg transition-all hover:scale-102 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {addingVehicle ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    List Vehicle
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

      <BottomNav />
    </div>
  );
}
