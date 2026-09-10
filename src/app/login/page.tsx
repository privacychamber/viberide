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
      setError("Please enter your phone number or email address.");
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
        setError(res.error || "Invalid credentials. Please check your phone/email and password.");
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
    <div className="w-full max-w-[440px] mx-auto py-8 px-4 sm:px-0">
      
      {/* Back Link */}
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          Welcome Back
        </h1>
        <p className="text-slate-500 text-sm">
          Login to manage your bookings and vehicles
        </p>
      </div>

      {/* Alerts */}
      {verified && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>Your email has been verified successfully! You can now log in.</span>
        </div>
      )}

      {registered && !verified && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>Account created successfully! Please login with your credentials.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        
        {/* Phone Number / Email */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-5 h-5" />
            </div>
            <input
              type="text"
              required
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Forgot Password */}
        <div className="flex justify-end pt-1">
          <Link
            href="/contact?subject=Password%20Reset%20Request"
            className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Login"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-7 flex items-center justify-center">
        <span className="text-slate-400 text-sm font-normal">— or —</span>
      </div>

      {/* Signup Link */}
      <div className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link 
          href="/signup" 
          className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors inline-flex items-center gap-1"
        >
          Register here &rarr;
        </Link>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center font-sans antialiased">
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="text-slate-400 text-sm">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
