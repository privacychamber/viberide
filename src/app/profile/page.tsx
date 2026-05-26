"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { User, ShieldCheck, ShieldAlert, FileImage, Image as ImageIcon, CheckCircle, Clock, Trash2, Calendar, MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");
  const [selfieImage, setSelfieImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [dbUser, setDbUser] = useState<any>(null);
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [mockBookings, setMockBookings] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Auto redirect if not logged in
  useEffect(() => {
    if (session === null) {
      router.push("/login?callbackUrl=/profile");
    }
  }, [session, router]);

  // Load profile data and bookings
  const loadProfileAndBookings = async () => {
    if (!session?.user?.id) return;
    setLoadingProfile(true);

    // Load mock bookings from localStorage
    const localBk = JSON.parse(localStorage.getItem("mock_bookings") || "[]");
    setMockBookings(localBk);

    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
        setDbBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Failed to load profile from DB:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadProfileAndBookings();
    }
  }, [session]);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setUploading(true);

    try {
      // Simulate file upload by setting high-res placeholders if not specified
      const payload = {
        frontUrl: frontImage || "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        backUrl: backImage || "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        selfieUrl: selfieImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      };

      const res = await fetch("/api/profile/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to submit documents");
      }

      const data = await res.json();
      
      // Update session token verification status trigger
      await updateSession({
        ...session,
        user: {
          ...session.user,
          verified: false, // goes to pending first
        }
      });

      setSubmitSuccess(true);
      await loadProfileAndBookings();
    } catch (error) {
      console.error("Verification submit failed:", error);
    } finally {
      setUploading(false);
    }
  };

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

  // Verification status check
  const verificationStatus = dbUser?.license?.status || "none"; // none, pending, verified, rejected

  // Merge live and mock bookings
  const allBookings = [...dbBookings, ...mockBookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
      <Navbar />

      <div className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* User Card Hero */}
        <section className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-16 h-16 rounded-full bg-forest-green/20 border border-forest-green-light flex items-center justify-center text-forest-green-light">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-heading font-black text-xl text-snow-white">{session.user.name}</h1>
              <p className="text-gray-400 text-sm">{session.user.phone}</p>
              <div className="mt-2 flex gap-2">
                <span className="text-[10px] bg-white/5 text-gray-300 font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/5">
                  Role: {dbUser?.role || session.user.role}
                </span>
                {dbUser?.role === "owner" && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold uppercase px-2 py-0.5 rounded border border-emerald-500/15">
                    Verified Host
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Verification Status Badge */}
          <div className="shrink-0">
            {verificationStatus === "verified" && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-2xl flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <div className="text-left">
                  <span className="block text-xs font-bold uppercase">KYC Verified</span>
                  <span className="block text-[10px] text-gray-400">Ready to Rent</span>
                </div>
              </div>
            )}
            {verificationStatus === "pending" && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Clock className="w-5 h-5 animate-pulse" />
                <div className="text-left">
                  <span className="block text-xs font-bold uppercase">Verification Pending</span>
                  <span className="block text-[10px] text-gray-400">Awaiting Admin Approval</span>
                </div>
              </div>
            )}
            {verificationStatus === "rejected" && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-2xl flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <div className="text-left">
                  <span className="block text-xs font-bold uppercase">KYC Rejected</span>
                  <span className="block text-[10px] text-gray-400">Please re-upload documents</span>
                </div>
              </div>
            )}
            {verificationStatus === "none" && (
              <div className="bg-white/5 border border-white/5 text-gray-400 px-4 py-2 rounded-2xl flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <div className="text-left">
                  <span className="block text-xs font-bold uppercase">KYC Not Started</span>
                  <span className="block text-[10px] text-gray-500">Upload Driving License</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Verification Form Section */}
        {verificationStatus !== "verified" && (
          <section className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
            <h2 className="font-heading font-extrabold text-lg text-snow-white flex items-center gap-2">
              <FileImage className="w-5 h-5 text-sunset-orange" />
              <span>Identity Verification (KYC)</span>
            </h2>

            {submitSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Documents submitted successfully! An administrator will review your files shortly.</span>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* DL Front */}
                <div className="bg-mountain-black border border-white/5 p-4 rounded-xl space-y-3">
                  <span className="block text-xs font-bold uppercase text-gray-500">DL Front Image</span>
                  <input
                    type="text"
                    placeholder="Enter Image URL (or leave blank for demo)"
                    value={frontImage}
                    onChange={(e) => setFrontImage(e.target.value)}
                    className="w-full bg-mountain-black-light border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-snow-white focus:outline-none focus:border-sunset-orange"
                  />
                  <div className="aspect-[4/3] rounded-lg border border-dashed border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                    {frontImage ? (
                      <img src={frontImage} alt="DL Front Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                </div>

                {/* DL Back */}
                <div className="bg-mountain-black border border-white/5 p-4 rounded-xl space-y-3">
                  <span className="block text-xs font-bold uppercase text-gray-500">DL Back Image</span>
                  <input
                    type="text"
                    placeholder="Enter Image URL (or leave blank for demo)"
                    value={backImage}
                    onChange={(e) => setBackImage(e.target.value)}
                    className="w-full bg-mountain-black-light border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-snow-white focus:outline-none focus:border-sunset-orange"
                  />
                  <div className="aspect-[4/3] rounded-lg border border-dashed border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                    {backImage ? (
                      <img src={backImage} alt="DL Back Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Selfie */}
                <div className="bg-mountain-black border border-white/5 p-4 rounded-xl space-y-3">
                  <span className="block text-xs font-bold uppercase text-gray-500">Selfie Verification</span>
                  <input
                    type="text"
                    placeholder="Enter Selfie URL (or leave blank for demo)"
                    value={selfieImage}
                    onChange={(e) => setSelfieImage(e.target.value)}
                    className="w-full bg-mountain-black-light border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-snow-white focus:outline-none focus:border-sunset-orange"
                  />
                  <div className="aspect-[4/3] rounded-lg border border-dashed border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                    {selfieImage ? (
                      <img src={selfieImage} alt="Selfie Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-gradient-to-r from-forest-green-light to-forest-green hover:from-sunset-orange hover:to-sunset-orange-dark text-snow-white font-bold text-sm rounded-xl shadow-lg transition-all hover:scale-102 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Submit Documents for Verification"
                )}
              </button>
            </form>
          </section>
        )}

        {/* Rental Booking History */}
        <section className="space-y-6">
          <h2 className="font-heading font-extrabold text-lg text-snow-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-forest-green-light" />
            <span>My Bookings & Trip History</span>
          </h2>

          {loadingProfile ? (
            <div className="text-center py-12">
              <span className="w-6 h-6 border-2 border-sunset-orange border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          ) : allBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* Booking metadata */}
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
                        <span>Location: {vehicle.location}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                      {status === "approved" ? (
                        <a
                          href={`https://wa.me/918888888888?text=Hi,%20my%20booking%20ID%20is%20${booking._id}%20for%20${vehicle.title}.%20Where%20should%20we%20meet%20for%20pickup?`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#25D366] hover:bg-[#20ba56] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat on WhatsApp
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-500 italic">WhatsApp button unlocks upon host approval</span>
                      )}

                      {isMock && (
                        <button
                          onClick={() => deleteMockBooking(booking._id)}
                          className="p-2 bg-white/5 border border-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                          title="Delete Mock Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-mountain-black-light/30 border border-dashed border-white/5 rounded-2xl">
              <p className="text-xs text-gray-500">You haven't requested any rides yet.</p>
              <Link
                href="/explore"
                className="mt-4 inline-flex bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold text-snow-white transition-all"
              >
                Find a Vehicle
              </Link>
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
