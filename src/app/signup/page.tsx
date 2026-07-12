"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Search, Home as HomeIcon, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";

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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.agreeTerms) {
      setError("You must agree to the Terms & Conditions");
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
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ""),
          password: formData.password,
          role: role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Success, redirect to login
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0 font-sans">
      <Navbar />
      <main className="flex-grow flex flex-col items-center px-4 py-8 max-w-2xl mx-auto w-full">
        
        {/* Back Link */}
        <div className="w-full mb-6">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="w-full mb-8">
          <h1 className="font-heading font-black text-3xl md:text-4xl text-snow-white mb-2 tracking-tight">Create Account</h1>
          <p className="text-gray-400 text-sm">List your vehicle or find your perfect ride</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          
          {/* Role Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-300">I am a...</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("renter")}
                className={`flex items-start p-4 rounded-2xl border transition-all ${
                  role === "renter" 
                    ? "bg-forest-green/10 border-forest-green text-white" 
                    : "bg-mountain-black-light border-white/10 text-gray-400 hover:border-white/30"
                }`}
              >
                <div className={`p-2 rounded-xl mr-3 ${role === "renter" ? "bg-forest-green/20 text-forest-green-light" : "bg-white/5"}`}>
                  <Search className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm mb-1">I'm Looking for a Vehicle</div>
                  <div className="text-xs opacity-70">Find & save rides</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("owner")}
                className={`flex items-start p-4 rounded-2xl border transition-all ${
                  role === "owner" 
                    ? "bg-forest-green/10 border-forest-green text-white" 
                    : "bg-mountain-black-light border-white/10 text-gray-400 hover:border-white/30"
                }`}
              >
                <div className={`p-2 rounded-xl mr-3 ${role === "owner" ? "bg-forest-green/20 text-forest-green-light" : "bg-white/5"}`}>
                  <HomeIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm mb-1">I Want to List My Vehicle</div>
                  <div className="text-xs opacity-70">Post & manage listings</div>
                </div>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                name="name"
                required
                placeholder="Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-mountain-black-light border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-snow-white focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green/50 transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                name="email"
                placeholder="rahul@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-mountain-black-light border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-snow-white focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green/50 transition-all placeholder:text-gray-600"
              />
            </div>
            <p className="text-[11px] text-forest-green-light mt-1.5 font-medium">Required for password recovery</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                name="phone"
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData((prev) => ({ ...prev, phone: val }));
                }}
                className="w-full bg-mountain-black-light border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-snow-white focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green/50 transition-all placeholder:text-gray-600"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 font-medium">This will be your login ID</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                minLength={6}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                minLength={6}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-mountain-black-light border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-sm text-snow-white focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green/50 transition-all placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="w-4 h-4 rounded border-white/20 bg-mountain-black-light text-forest-green focus:ring-forest-green focus:ring-offset-0"
            />
            <label htmlFor="agreeTerms" className="ml-3 text-xs text-gray-400">
              I agree to Terms & Conditions
            </label>
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
              "Create Account"
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-[#10b981] font-bold hover:underline">
            Login here &rarr;
          </Link>
        </div>
        
      </main>
      <BottomNav />
    </div>
  );
}
