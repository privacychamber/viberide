"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Compass, Phone, Key, User, ShieldAlert } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("renter");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setLoading(true);

    // Simulate OTP sending delay
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setOtp("123456"); // Pre-fill mock OTP for easy testing
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        phone,
        name,
        otp,
        role,
        redirect: false,
      });

      setLoading(false);

      if (res?.error) {
        setError(res.error || "Authentication failed. Check details.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="w-full max-w-md bg-mountain-black-light/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-forest-green-dark/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sunset-orange/20 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center mb-8 relative z-10">
        <span className="inline-flex p-3 bg-forest-green/10 rounded-2xl text-sunset-orange font-bold text-2xl mb-3">
          🛵
        </span>
        <h2 className="font-heading font-black text-2xl text-snow-white">Welcome to Viberide</h2>
        <p className="text-xs text-gray-500 mt-1">Enter your phone number to sign in or create an account.</p>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 mb-6 leading-relaxed">
          {error}
        </p>
      )}

      {!otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-5 relative z-10">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                type="tel"
                required
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full bg-mountain-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-snow-white focus:outline-none focus:border-sunset-orange focus:ring-0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-forest-green-light to-forest-green hover:from-sunset-orange hover:to-sunset-orange-dark text-snow-white font-bold text-sm rounded-xl shadow-lg transition-all hover:scale-102 cursor-pointer flex items-center justify-center"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Send OTP"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          {/* Capture Name for New Registration */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Full Name (New Users Only)</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-mountain-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-snow-white focus:outline-none focus:border-sunset-orange focus:ring-0"
              />
            </div>
          </div>

          {/* Role Selection for New Registration */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">I want to (New Users Only)</label>
            <div className="flex bg-mountain-black border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setRole("renter")}
                className={`flex-1 text-xs py-2.5 rounded-lg font-bold transition-all ${
                  role === "renter" ? "bg-white/10 text-snow-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Rent Vehicles
              </button>
              <button
                type="button"
                onClick={() => setRole("owner")}
                className={`flex-1 text-xs py-2.5 rounded-lg font-bold transition-all ${
                  role === "owner" ? "bg-white/10 text-snow-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                List My Vehicle
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Enter 6-Digit OTP</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                required
                maxLength={6}
                placeholder="6-digit verification code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full bg-mountain-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-snow-white focus:outline-none focus:border-sunset-orange focus:ring-0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-sunset-orange to-sunset-orange-dark hover:from-sunset-orange-dark hover:to-sunset-orange text-snow-white font-bold text-sm rounded-xl shadow-lg transition-all hover:scale-102 cursor-pointer flex items-center justify-center"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Verify & Login"
            )}
          </button>
        </form>
      )}

      {/* Demo Hints Section */}
      <div className="mt-8 pt-6 border-t border-white/5 text-left text-xs text-gray-500">
        <p className="font-bold mb-2 flex items-center gap-1 text-gray-400">
          <Compass className="w-3.5 h-3.5 text-sunset-orange" />
          <span>Demo Account Credentials:</span>
        </p>
        <ul className="space-y-1 text-[11px] list-disc list-inside">
          <li>Admin: <strong className="text-gray-400">9999999999</strong></li>
          <li>Owner: <strong className="text-gray-400">8888888888</strong></li>
          <li>Renter: <strong className="text-gray-400">6666666666</strong></li>
          <li>Any other number creates a new renter profile.</li>
          <li>Default OTP is <strong className="text-gray-400">123456</strong>.</li>
        </ul>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div>Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
