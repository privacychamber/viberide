"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Car, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle 
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"renter" | "owner">("renter");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.agreeTerms) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/process/r/index.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: cleanPhone,
          password: formData.password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create account. Please try again.");
      }

      // Store temporary auth handoff for instant zero-blocker dashboard login
      try {
        sessionStorage.setItem(
          "viberide_auth_handoff",
          JSON.stringify({
            phone: cleanPhone,
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            role,
          })
        );
      } catch (e) {
        console.warn("Session storage not available:", e);
      }

      // Redirect to OTP verification
      router.push(`/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mountain-black text-snow-white flex flex-col justify-center items-center py-8 px-4 relative overflow-hidden font-sans antialiased selection:bg-sunset-orange selection:text-snow-white">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[380px] bg-emerald-950/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-[420px] mx-auto relative z-10">
        
        {/* Back Link */}
        <div className="mb-3.5">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-400 hover:text-snow-white transition-colors text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Home
          </Link>
        </div>

        {/* Main Glass Card */}
        <div className="bg-[#131913]/90 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
          
          {/* Header */}
          <div className="mb-5 text-center">
            <Link href="/" className="inline-block mb-2">
              <span className="font-heading font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sunset-orange to-amber-500">
                VIBERIDE
              </span>
            </Link>
            <h1 className="font-heading font-bold text-2xl text-snow-white tracking-tight">
              Create Account
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Rent vehicles or list your own ride
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Role Selection Cards */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* Renter */}
                <button
                  type="button"
                  onClick={() => setRole("renter")}
                  className={`p-2.5 sm:p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    role === "renter"
                      ? "bg-emerald-500/15 border-emerald-500 text-snow-white shadow-xs"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-lg ${role === "renter" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-400"}`}>
                      <Search className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-snow-white leading-tight">
                      Looking to Rent
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                      Find &amp; book rides
                    </p>
                  </div>
                </button>

                {/* Owner */}
                <button
                  type="button"
                  onClick={() => setRole("owner")}
                  className={`p-2.5 sm:p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    role === "owner"
                      ? "bg-emerald-500/15 border-emerald-500 text-snow-white shadow-xs"
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-lg ${role === "owner" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-400"}`}>
                      <Car className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-snow-white leading-tight">
                      List My Vehicle
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                      Host &amp; earn income
                    </p>
                  </div>
                </button>

              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Rahul Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#1b241b]/90 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-snow-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="rahul@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#1b241b]/90 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-snow-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>
              <p className="text-[11px] text-emerald-400 mt-1">
                Required for email verification &amp; recovery
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-[#1b241b]/90 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-snow-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                This will be your primary login ID
              </p>
            </div>

            {/* Password & Confirm Password in 2 Cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Min 6 chars"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-[#1b241b]/90 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs sm:text-sm text-snow-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Confirm
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-[#1b241b]/90 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs sm:text-sm text-snow-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="w-3.5 h-3.5 text-emerald-600 bg-[#1b241b] border-white/20 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="text-xs text-gray-400 cursor-pointer select-none">
                I agree to{" "}
                <Link href="/terms" target="_blank" className="text-emerald-400 hover:underline font-medium">
                  Terms &amp; Conditions
                </Link>
              </label>
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
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center text-xs text-gray-400 mt-4 pt-3 border-t border-white/10">
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors inline-flex items-center gap-0.5"
            >
              Login here &rarr;
            </Link>
          </div>

        </div>

      </main>
    </div>
  );
}
