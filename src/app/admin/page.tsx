"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Shield, Users, Calendar, TrendingUp, Check, X, ShieldAlert, FileText, Image as ImageIcon, MapPin } from "lucide-react";

export default function AdminConsole() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [usersQueue, setUsersQueue] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    totalCommissions: 0,
  });

  // Auto redirect if not logged in
  useEffect(() => {
    if (session === null) {
      router.push("/login?callbackUrl=/admin");
    }
  }, [session, router]);

  const fetchAdminData = async () => {
    if (!session?.user?.id || session.user.role !== "admin") return;
    setLoadingDashboard(true);
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        const data = await res.json();
        setUsersQueue(data.usersQueue || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load admin stats:", error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id && session.user.role === "admin") {
      fetchAdminData();
    } else {
      setLoadingDashboard(false);
    }
  }, [session]);

  const handleVerifyUser = async (userId: string, action: "verify" | "reject") => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        await fetchAdminData();
      }
    } catch (error) {
      console.error("Failed to update user verification status:", error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-mountain-black flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = session.user.role === "admin";

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
        <Navbar />
        <div className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-8 py-16 flex flex-col items-center justify-center text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 text-4xl">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="max-w-xl space-y-4">
            <h1 className="font-heading font-black text-3xl text-snow-white">
              Access Denied
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              You must have an administrator account to view the Admin Console. Please log in with the admin phone number (<strong className="text-snow-white">9999999999</strong>) to test the admin functionality.
            </p>
            <div className="pt-4">
              <Link href="/profile" className="text-xs font-bold text-sunset-orange hover:text-snow-white underline">
                Go back to profile
              </Link>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
      <Navbar />

      <div className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Header Title */}
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-snow-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-sunset-orange" />
            <span>Admin Console</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Oversee platform statistics, verify driver credentials, and monitor fleet listings.</p>
        </div>

        {/* Admin Dashboard Stats */}
        {loadingDashboard ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-mountain-black-light border border-white/5 p-4 rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <div className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start text-gray-500">
                <span className="text-[10px] font-bold uppercase">Total Users</span>
                <Users className="w-4 h-4" />
              </div>
              <span className="block font-heading font-black text-2xl text-snow-white mt-2">{stats.totalUsers}</span>
              <span className="block text-[9px] text-emerald-400 mt-1">{stats.verifiedUsers} verified KYC</span>
            </div>

            {/* Stat 2 */}
            <div className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start text-gray-500">
                <span className="text-[10px] font-bold uppercase">Active Fleet</span>
                <span className="text-base font-bold">🛵</span>
              </div>
              <span className="block font-heading font-black text-2xl text-snow-white mt-2">{stats.totalVehicles}</span>
              <span className="block text-[9px] text-gray-400 mt-1">Listed in Dharamshala & Bir</span>
            </div>

            {/* Stat 3 */}
            <div className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start text-gray-500">
                <span className="text-[10px] font-bold uppercase">Bookings</span>
                <Calendar className="w-4 h-4" />
              </div>
              <span className="block font-heading font-black text-2xl text-snow-white mt-2">{stats.totalBookings}</span>
              <span className="block text-[9px] text-gray-400 mt-1">Reservations submitted</span>
            </div>

            {/* Stat 4 */}
            <div className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start text-gray-500">
                <span className="text-[10px] font-bold uppercase">Commission (10%)</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="block font-heading font-black text-2xl text-emerald-400 mt-2">₹{stats.totalCommissions}</span>
              <span className="block text-[9px] text-gray-400 mt-1">Platform gross revenue</span>
            </div>
          </div>
        )}

        {/* KYC Verification Queue */}
        <section className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
          <h2 className="font-heading font-extrabold text-lg text-snow-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sunset-orange" />
            <span>Document Verification Queue ({usersQueue.length})</span>
          </h2>

          {loadingDashboard ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-28 bg-mountain-black rounded-xl" />
            </div>
          ) : usersQueue.length > 0 ? (
            <div className="space-y-6">
              {usersQueue.map((user) => (
                <div key={user._id} className="bg-mountain-black border border-white/5 p-5 rounded-xl space-y-4">
                  {/* User info */}
                  <div className="flex justify-between items-start flex-col sm:flex-row gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-snow-white">{user.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Phone: {user.phone} | Role: {user.role}</p>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <button
                        onClick={() => handleVerifyUser(user._id, "verify")}
                        className="flex-1 sm:flex-none bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve KYC
                      </button>
                      <button
                        onClick={() => handleVerifyUser(user._id, "reject")}
                        className="flex-1 sm:flex-none bg-rose-500/10 border border-rose-500/25 text-rose-400 px-3.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject KYC
                      </button>
                    </div>
                  </div>

                  {/* Document pre-render previews */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* Front DL */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-bold uppercase text-gray-500">DL Front View</span>
                      <div className="aspect-[4/3] rounded-lg bg-mountain-black-light border border-white/5 overflow-hidden flex items-center justify-center">
                        {user.license?.frontUrl ? (
                          <img src={user.license.frontUrl} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-700" />
                        )}
                      </div>
                    </div>

                    {/* Back DL */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-bold uppercase text-gray-500">DL Back View</span>
                      <div className="aspect-[4/3] rounded-lg bg-mountain-black-light border border-white/5 overflow-hidden flex items-center justify-center">
                        {user.license?.backUrl ? (
                          <img src={user.license.backUrl} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-700" />
                        )}
                      </div>
                    </div>

                    {/* Selfie */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-bold uppercase text-gray-500">Selfie Match</span>
                      <div className="aspect-[4/3] rounded-lg bg-mountain-black-light border border-white/5 overflow-hidden flex items-center justify-center">
                        {user.selfieUrl ? (
                          <img src={user.selfieUrl} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-700" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-gray-500 border border-dashed border-white/5 rounded-xl">
              Verification queue is empty. There are no users pending license review.
            </div>
          )}
        </section>

      </div>

      <BottomNav />
    </div>
  );
}
