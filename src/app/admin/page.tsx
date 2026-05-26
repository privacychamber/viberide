"use client";
 
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { 
  Shield, Users, Calendar, TrendingUp, Check, X, ShieldAlert, FileText, 
  Image as ImageIcon, MapPin, Star, Flag, Search, Trash2, CheckCircle, Clock 
} from "lucide-react";

type TabType = "kyc" | "vehicles" | "fleet" | "users";

export default function AdminConsole() {
  const { data: session } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("kyc");
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  
  // Data lists
  const [usersQueue, setUsersQueue] = useState<any[]>([]);
  const [vehiclesQueue, setVehiclesQueue] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // Search states
  const [userSearch, setUserSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    totalCommissions: 0,
  });

  // Action status message
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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
        setVehiclesQueue(data.vehiclesQueue || []);
        setAllVehicles(data.allVehicles || []);
        setAllUsers(data.allUsers || []);
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

  const triggerMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleVerifyUser = async (userId: string, action: "verify" | "reject") => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        triggerMessage(`User KYC ${action === "verify" ? "approved" : "rejected"} successfully.`);
        await fetchAdminData();
      }
    } catch (error) {
      console.error("Failed to update user verification status:", error);
    }
  };

  const handleFlagUser = async (userId: string, flagged: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged }),
      });

      if (res.ok) {
        triggerMessage(`User fraud flag set to ${flagged}.`);
        await fetchAdminData();
      }
    } catch (error) {
      console.error("Failed to update user fraud status:", error);
    }
  };

  const handleUpdateVehicle = async (vehicleId: string, updates: { status?: string; featured?: boolean; flagged?: boolean }) => {
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        triggerMessage("Vehicle settings updated successfully.");
        await fetchAdminData();
      }
    } catch (error) {
      console.error("Failed to update vehicle:", error);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;
    try {
      const res = await fetch(`/api/owner/vehicles/${vehicleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        triggerMessage("Vehicle listing deleted successfully.");
        await fetchAdminData();
      }
    } catch (error) {
      console.error("Failed to delete vehicle:", error);
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

  // Filtered lists based on search
  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.phone.includes(userSearch)
  );

  const filteredVehicles = allVehicles.filter(v => 
    v.title.toLowerCase().includes(vehicleSearch.toLowerCase()) || 
    v.brand.toLowerCase().includes(vehicleSearch.toLowerCase()) || 
    (v.owner?.name && v.owner.name.toLowerCase().includes(vehicleSearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
      <Navbar />

      <div className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-snow-white flex items-center gap-2">
              <Shield className="w-8 h-8 text-sunset-orange" />
              <span>Admin Console</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Oversee platform statistics, verify driver credentials, and monitor fleet listings.</p>
          </div>
          
          {actionMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg animate-fade-in shrink-0">
              <CheckCircle className="w-4 h-4" />
              <span>{actionMessage}</span>
            </div>
          )}
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
            <div className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start text-gray-500">
                <span className="text-[10px] font-bold uppercase">Total Users</span>
                <Users className="w-4 h-4" />
              </div>
              <span className="block font-heading font-black text-2xl text-snow-white mt-2">{stats.totalUsers}</span>
              <span className="block text-[9px] text-emerald-400 mt-1">{stats.verifiedUsers} verified KYC</span>
            </div>

            <div className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start text-gray-500">
                <span className="text-[10px] font-bold uppercase">Active Fleet</span>
                <span className="text-base font-bold">🛵</span>
              </div>
              <span className="block font-heading font-black text-2xl text-snow-white mt-2">{stats.totalVehicles}</span>
              <span className="block text-[9px] text-gray-400 mt-1">Listed in Dharamshala & Bir</span>
            </div>

            <div className="bg-mountain-black-light border border-white/5 p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start text-gray-500">
                <span className="text-[10px] font-bold uppercase">Bookings</span>
                <Calendar className="w-4 h-4" />
              </div>
              <span className="block font-heading font-black text-2xl text-snow-white mt-2">{stats.totalBookings}</span>
              <span className="block text-[9px] text-gray-400 mt-1">Reservations submitted</span>
            </div>

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

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-b border-white/5 gap-2 scrollbar-none overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("kyc")}
            className={`px-4 py-2.5 font-heading text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === "kyc"
                ? "border-sunset-orange text-sunset-orange"
                : "border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>KYC Queue ({usersQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("vehicles")}
            className={`px-4 py-2.5 font-heading text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === "vehicles"
                ? "border-sunset-orange text-sunset-orange"
                : "border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Listing Queue ({vehiclesQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-4 py-2.5 font-heading text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === "fleet"
                ? "border-sunset-orange text-sunset-orange"
                : "border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10"
            }`}
          >
            <span>🛵</span>
            <span>Fleet Manager ({allVehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 font-heading text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === "users"
                ? "border-sunset-orange text-sunset-orange"
                : "border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({allUsers.length})</span>
          </button>
        </div>

        {/* Tab 1: KYC Verification Queue */}
        {activeTab === "kyc" && (
          <section className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
            <h2 className="font-heading font-extrabold text-lg text-snow-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-sunset-orange" />
              <span>Identity Verification Queue</span>
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
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-snow-white">{user.name}</h4>
                          {user.flagged && (
                            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Flag className="w-2.5 h-2.5 fill-rose-400" /> FLAGGED FRAUD
                            </span>
                          )}
                        </div>
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
                        <button
                          onClick={() => handleFlagUser(user._id, !user.flagged)}
                          className={`p-1.5 border rounded-lg hover:scale-105 transition-all cursor-pointer ${
                            user.flagged 
                              ? "bg-rose-500/20 border-rose-500/30 text-rose-400" 
                              : "bg-white/5 border-white/10 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
                          }`}
                          title={user.flagged ? "Unflag User" : "Flag User for Fraud"}
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Document pre-render previews */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <span className="block text-[9px] font-bold uppercase text-gray-500">DL Front View</span>
                        <div className="aspect-[4/3] rounded-lg bg-mountain-black-light border border-white/5 overflow-hidden flex items-center justify-center relative group">
                          {user.license?.frontUrl ? (
                            <>
                              <img src={user.license.frontUrl} className="w-full h-full object-cover" />
                              <a href={user.license.frontUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-snow-white transition-opacity">View Fullsize</a>
                            </>
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-700" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[9px] font-bold uppercase text-gray-500">DL Back View</span>
                        <div className="aspect-[4/3] rounded-lg bg-mountain-black-light border border-white/5 overflow-hidden flex items-center justify-center relative group">
                          {user.license?.backUrl ? (
                            <>
                              <img src={user.license.backUrl} className="w-full h-full object-cover" />
                              <a href={user.license.backUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-snow-white transition-opacity">View Fullsize</a>
                            </>
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-700" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[9px] font-bold uppercase text-gray-500">Selfie Match</span>
                        <div className="aspect-[4/3] rounded-lg bg-mountain-black-light border border-white/5 overflow-hidden flex items-center justify-center relative group">
                          {user.selfieUrl ? (
                            <>
                              <img src={user.selfieUrl} className="w-full h-full object-cover" />
                              <a href={user.selfieUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-snow-white transition-opacity">View Fullsize</a>
                            </>
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
        )}

        {/* Tab 2: Vehicle Listing Queue */}
        {activeTab === "vehicles" && (
          <section className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
            <h2 className="font-heading font-extrabold text-lg text-snow-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-sunset-orange" />
              <span>Vehicle Listing Queue</span>
            </h2>

            {loadingDashboard ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-28 bg-mountain-black rounded-xl" />
              </div>
            ) : vehiclesQueue.length > 0 ? (
              <div className="space-y-6">
                {vehiclesQueue.map((vehicle) => (
                  <div key={vehicle._id} className="bg-mountain-black border border-white/5 p-5 rounded-xl space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start flex-col sm:flex-row gap-2">
                      <div className="flex gap-4">
                        <div className="w-16 h-12 rounded bg-black/25 overflow-hidden shrink-0 border border-white/5">
                          <img src={vehicle.images?.[0] || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=150&q=80"} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-snow-white">{vehicle.title}</h4>
                          <span className="text-[10px] text-gray-500 block mt-0.5">
                            Owner: {vehicle.owner?.name} ({vehicle.owner?.phone})
                          </span>
                          <span className="text-[10px] text-forest-green-light block">
                            Location: {vehicle.location} | Pricing: ₹{vehicle.pricePerDay}/day
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button
                          onClick={() => handleUpdateVehicle(vehicle._id, { status: "approved" })}
                          className="flex-1 sm:flex-none bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve Listing
                        </button>
                        <button
                          onClick={() => handleUpdateVehicle(vehicle._id, { status: "rejected" })}
                          className="flex-1 sm:flex-none bg-rose-500/10 border border-rose-500/25 text-rose-400 px-3.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject Listing
                        </button>
                      </div>
                    </div>

                    {/* Listing document details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <div className="space-y-1.5">
                        <span className="block text-[9px] font-bold uppercase text-gray-500">Registration Certificate (RC)</span>
                        <div className="aspect-[16/9] rounded-lg bg-mountain-black-light border border-white/5 overflow-hidden flex items-center justify-center relative group">
                          {vehicle.documents?.rcUrl ? (
                            <>
                              <img src={vehicle.documents.rcUrl} className="w-full h-full object-cover" />
                              <a href={vehicle.documents.rcUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-snow-white transition-opacity">View Full RC</a>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-600">No RC Document Provided</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[9px] font-bold uppercase text-gray-500">Insurance Certificate</span>
                        <div className="aspect-[16/9] rounded-lg bg-mountain-black-light border border-white/5 overflow-hidden flex items-center justify-center relative group">
                          {vehicle.documents?.insuranceUrl ? (
                            <>
                              <img src={vehicle.documents.insuranceUrl} className="w-full h-full object-cover" />
                              <a href={vehicle.documents.insuranceUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-snow-white transition-opacity">View Full Insurance</a>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-600">No Insurance Document Provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-gray-500 border border-dashed border-white/5 rounded-xl">
                Listing queue is empty. There are no vehicles pending approval.
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Fleet Manager */}
        {activeTab === "fleet" && (
          <section className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-snow-white">Fleet Manager</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Toggle listings as featured, flag suspicious listings, or adjust status.</p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search fleet by brand, title, owner..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="w-full bg-mountain-black border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-snow-white focus:outline-none focus:border-sunset-orange"
                />
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {loadingDashboard ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-mountain-black rounded-lg" />
                <div className="h-12 bg-mountain-black rounded-lg" />
              </div>
            ) : filteredVehicles.length > 0 ? (
              <div className="overflow-x-auto border border-white/5 rounded-xl">
                <table className="w-full text-xs text-left text-gray-400">
                  <thead className="bg-mountain-black text-[10px] font-bold uppercase text-gray-500 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3">Vehicle Details</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Featured / Flagged</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredVehicles.map((vehicle) => (
                      <tr key={vehicle._id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-7 rounded bg-black/25 overflow-hidden shrink-0 border border-white/5">
                              <img src={vehicle.images?.[0] || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=100&q=80"} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="font-bold text-snow-white block">{vehicle.title}</span>
                              <span className="text-[10px] text-gray-500 block">₹{vehicle.pricePerDay}/day • {vehicle.type}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-snow-white block">{vehicle.owner?.name || "Unknown"}</span>
                            <span className="text-[10px] text-gray-500 block">{vehicle.owner?.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{vehicle.location}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                            vehicle.status === "approved"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : vehicle.status === "rejected"
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          }`}>
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {/* Featured status */}
                            <button
                              onClick={() => handleUpdateVehicle(vehicle._id, { featured: !vehicle.featured })}
                              className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                                vehicle.featured
                                  ? "bg-amber-500/15 border-amber-500/35 text-amber-400"
                                  : "bg-white/5 border-white/10 text-gray-600 hover:text-amber-400 hover:bg-amber-500/10"
                              }`}
                              title={vehicle.featured ? "Remove Featured Status" : "Mark as Featured"}
                            >
                              <Star className={`w-3.5 h-3.5 ${vehicle.featured ? "fill-amber-400" : ""}`} />
                            </button>
                            
                            {/* Flagged status */}
                            <button
                              onClick={() => handleUpdateVehicle(vehicle._id, { flagged: !vehicle.flagged })}
                              className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                                vehicle.flagged
                                  ? "bg-rose-500/15 border-rose-500/35 text-rose-400"
                                  : "bg-white/5 border-white/10 text-gray-600 hover:text-rose-400 hover:bg-rose-500/10"
                              }`}
                              title={vehicle.flagged ? "Unflag Listing" : "Flag Listing as Suspected Fraud"}
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {vehicle.status === "pending" && (
                              <button
                                onClick={() => handleUpdateVehicle(vehicle._id, { status: "approved" })}
                                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteVehicle(vehicle._id)}
                              className="bg-white/5 hover:bg-rose-500/15 hover:text-rose-400 text-gray-400 border border-white/10 px-2 py-1 rounded transition-colors cursor-pointer"
                              title="Delete Listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-gray-500 border border-dashed border-white/5 rounded-xl">
                No vehicles matched the search criteria.
              </div>
            )}
          </section>
        )}

        {/* Tab 4: User Directory */}
        {activeTab === "users" && (
          <section className="bg-mountain-black-light border border-white/5 p-6 rounded-2xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-snow-white">User Directory</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Browse all users, verify KYC directly, and manage fraud blocklists.</p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search users by name, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-mountain-black border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-snow-white focus:outline-none focus:border-sunset-orange"
                />
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {loadingDashboard ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-mountain-black rounded-lg" />
                <div className="h-12 bg-mountain-black rounded-lg" />
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto border border-white/5 rounded-xl">
                <table className="w-full text-xs text-left text-gray-400">
                  <thead className="bg-mountain-black text-[10px] font-bold uppercase text-gray-500 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3">User Details</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">KYC Status</th>
                      <th className="px-4 py-3">Fraud Blocklist</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-bold text-snow-white block">{user.name}</span>
                            <span className="text-[10px] text-gray-500 block">{user.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] uppercase font-bold text-gray-300">{user.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                            user.license?.status === "verified"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : user.license?.status === "pending"
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : user.license?.status === "rejected"
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : "bg-white/5 border-white/10 text-gray-500"
                          }`}>
                            {user.license?.status || "None"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleFlagUser(user._id, !user.flagged)}
                            className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                              user.flagged
                                ? "bg-rose-500/15 border-rose-500/35 text-rose-400"
                                : "bg-white/5 border-white/10 text-gray-600 hover:text-rose-400 hover:bg-rose-500/10"
                            }`}
                            title={user.flagged ? "Unflag User" : "Flag User"}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {user.license?.status === "pending" && (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleVerifyUser(user._id, "verify")}
                                className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => handleVerifyUser(user._id, "reject")}
                                className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-gray-500 border border-dashed border-white/5 rounded-xl">
                No users matched the search criteria.
              </div>
            )}
          </section>
        )}

      </div>

      <BottomNav />
    </div>
  );
}
