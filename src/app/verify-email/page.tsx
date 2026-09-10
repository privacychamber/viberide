"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, MailCheck, AlertCircle, CheckCircle2 } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const reason = searchParams.get("reason");

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Handle digit input & auto-advance
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      pastedDigits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: fullOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verification failed. Please check your code.");
      }

      setSuccessMsg("Email verified! Logging you into your dashboard...");

      // Automatically sign in the user without any blocker
      let destination = "/profile";
      try {
        const stored = sessionStorage.getItem("viberide_auth_handoff");
        if (stored) {
          const authData = JSON.parse(stored);
          sessionStorage.removeItem("viberide_auth_handoff");

          if (authData.role === "owner") {
            destination = "/owner";
          }

          const loginRes = await signIn("credentials", {
            phone: authData.phone || email,
            password: authData.password,
            redirect: false,
          });

          if (!loginRes?.error) {
            router.push(destination);
            router.refresh();
            return;
          }
        }
      } catch (authErr) {
        console.warn("Auto-login fallback:", authErr);
      }

      // Fallback redirect
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          action: "resend",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to resend verification code.");
      }

      setSuccessMsg("A new 6-digit code has been sent to your email!");
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-[380px] sm:max-w-[400px] mx-auto">
      
      {/* Back Link */}
      <div className="mb-4">
        <Link 
          href="/login" 
          className="inline-flex items-center text-gray-400 hover:text-snow-white transition-colors text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Login
        </Link>
      </div>

      {/* Main Glass Card */}
      <div className="bg-[#131913]/90 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
        
        {/* Header with Icon */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20 shadow-xs">
            <MailCheck className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-snow-white tracking-tight">
            Verify Email
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            We sent a 6-digit verification code to
          </p>
          <p className="font-medium text-emerald-400 text-xs mt-0.5 break-all">
            {email || "your registered email"}
          </p>
        </div>

        {/* Reason notice if unverified user attempted login */}
        {reason === "unverified" && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Please verify your email to activate and log in to your account.</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          
          {/* OTP Input Boxes */}
          <div>
            <label className="block text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
              Enter 6-Digit Code
            </label>
            <div className="flex justify-between gap-1.5 sm:gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-11 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold text-snow-white bg-[#1b241b]/90 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-xs"
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || otp.join("").length < 6}
            className="w-full py-2.5 sm:py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Verify Email"
            )}
          </button>
        </form>

        {/* Resend OTP */}
        <div className="text-center mt-4 text-xs text-gray-400">
          Didn&apos;t receive the code?{" "}
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend Code"}
            </button>
          ) : (
            <span className="text-gray-500 font-medium">
              Resend in {countdown}s
            </span>
          )}
        </div>

        {/* Change email */}
        <div className="text-center text-[11px] text-gray-500 mt-4 pt-3 border-t border-white/10">
          Entered the wrong email?{" "}
          <Link href="/signup" className="text-gray-400 hover:text-snow-white underline">
            Register with a different email
          </Link>
        </div>

      </div>

    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-mountain-black text-snow-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans antialiased selection:bg-sunset-orange selection:text-snow-white">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[350px] bg-emerald-950/25 rounded-full blur-[110px] pointer-events-none" />

      <main className="w-full flex items-center justify-center relative z-10">
        <Suspense fallback={<div className="text-gray-500 text-xs">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </main>
    </div>
  );
}
