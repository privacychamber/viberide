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
      setError("Please enter a valid email address for verification.");
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
      setError("Please agree to the Terms & Conditions to continue.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
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

      // Store temporary auth handoff so user enters dashboard automatically after email OTP
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
        console.warn("Storage not available:", e);
      }

      // Success: Redirect to email verification page with email in query
      router.push(`/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center font-sans antialiased py-10 px-4 sm:px-6">
      <main className="w-full max-w-[480px] mx-auto">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-slate-500 text-sm">
            Rent vehicles or list your own ride
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Role Selection Cards */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2.5">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              
              {/* Renter Card */}
              <button
                type="button"
                onClick={() => setRole("renter")}
                className={`p-3.5 sm:p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  role === "renter"
                    ? "bg-emerald-50/60 border-2 border-green-600 shadow-xs"
                    : "bg-white border border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${role === "renter" ? "bg-emerald-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                    I&apos;m Looking to Rent
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    Find &amp; book vehicles
                  </p>
                </div>
              </button>

              {/* Owner Card */}
              <button
                type="button"
                onClick={() => setRole("owner")}
                className={`p-3.5 sm:p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  role === "owner"
                    ? "bg-emerald-50/60 border-2 border-green-600 shadow-xs"
                    : "bg-white border border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${role === "owner" ? "bg-emerald-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                    I Want to List My Vehicle
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    Host &amp; manage fleet
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="name"
                required
                placeholder="Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                name="email"
                required
                placeholder="rahul@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all shadow-xs"
              />
            </div>
            <p className="text-xs text-green-600 font-medium mt-1.5">
              Required for email verification &amp; password recovery
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                name="phone"
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all shadow-xs"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              This will be your login ID
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
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

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-600 cursor-pointer"
            />
            <label htmlFor="agreeTerms" className="text-xs sm:text-sm text-slate-600 cursor-pointer select-none">
              I agree to{" "}
              <Link href="/terms" target="_blank" className="text-green-600 hover:underline font-medium">
                Terms &amp; Conditions
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center text-sm text-slate-600 mt-8">
          Already have an account?{" "}
          <Link 
            href="/login" 
            className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors inline-flex items-center gap-1"
          >
            Login here &rarr;
          </Link>
        </div>

      </main>
    </div>
  );
}
