"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Phone, Lock, Eye, EyeOff, Compass } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";
  const registered = searchParams.get("registered");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        phone,
        password,
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
    <div className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center">
      
      {/* Back Link */}
      <div className="w-full mb-6 text-left">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="w-full mb-8 text-center">
        <h1 className="font-heading font-black text-3xl md:text-4xl text-snow-white mb-2 tracking-tight">Welcome Back</h1>
        <p className="text-gray-400 text-sm">Login to continue to Viberide</p>
      </div>

      {registered && (
        <div className="w-full mb-6 p-4 bg-forest-green/10 border border-forest-green/20 text-forest-green-light rounded-xl text-sm font-medium">
          Account created successfully! Please login.
        </div>
      )}

      {error && (
        <div className="w-full mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="w-full space-y-6">
        
        {/* Phone Number */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full bg-mountain-black-light border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-snow-white focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green/50 transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-mountain-black-light border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-sm text-snow-white focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green/50 transition-all placeholder:text-gray-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-4 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center justify-center text-[15px]"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Login"
          )}
        </button>
      </form>

      {/* Signup Link */}
      <div className="mt-8 text-sm text-gray-400">
        Don't have an account?{" "}
        <Link href="/signup" className="text-[#10b981] font-bold hover:underline">
          Create Account &rarr;
        </Link>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0 font-sans">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full">
        <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
