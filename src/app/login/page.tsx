"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";
  const registered = searchParams.get("registered");
  const verified = searchParams.get("verified");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError("Please enter your phone number or email.");
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
        if (res.error.startsWith("UNVERIFIED_EMAIL:")) {
          const unverifiedEmail = res.error.split(":")[1];
          router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&reason=unverified`);
          return;
        }
        setError(res.error || "Invalid credentials. Please check your details.");
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
    <div className="w-full max-w-[380px] sm:max-w-[400px] mx-auto">
      
      {/* Back to Home Link */}
      <div className="mb-4">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-400 hover:text-snow-white transition-colors text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Home
        </Link>
      </div>

      {/* Main Glass Card */}
      <div className="bg-[#131913]/90 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
        
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block mb-3">
            <span className="font-heading font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sunset-orange to-amber-500">
              VIBERIDE
            </span>
          </Link>
          <h1 className="font-heading font-bold text-2xl text-snow-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Login to manage your bookings and vehicles
          </p>
        </div>

        {/* Status Alerts */}
        {verified && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Email verified successfully! You can now log in.</span>
          </div>
        )}

        {registered && !verified && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Account created! Please log in with your credentials.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Phone / Email */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Phone Number or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#1b241b]/90 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-snow-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-300">
                Password
              </label>
              <Link
                href="/contact?subject=Password%20Reset%20Request"
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1b241b]/90 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-snow-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center text-xs sm:text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-[#131913] text-gray-500 text-xs">
            or
          </span>
        </div>

        {/* Register Link */}
        <div className="text-center text-xs text-gray-400">
          Don&apos;t have an account?{" "}
          <Link 
            href="/signup" 
            className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors inline-flex items-center gap-0.5"
          >
            Register here &rarr;
          </Link>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-mountain-black text-snow-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans antialiased selection:bg-sunset-orange selection:text-snow-white">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[350px] bg-emerald-950/25 rounded-full blur-[110px] pointer-events-none" />
      
      <main className="w-full flex items-center justify-center relative z-10">
        <Suspense fallback={<div className="text-gray-500 text-xs">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
