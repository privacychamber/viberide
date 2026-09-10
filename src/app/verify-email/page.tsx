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
    // If pasted multi-digit
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
      setError("Please enter the complete 6-digit verification code.");
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

      // Fallback if session data wasn't in memory
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
    <div className="w-full max-w-[440px] mx-auto py-8 px-4 sm:px-0">
      
      {/* Back Link */}
      <div className="mb-8">
        <Link 
          href="/login" 
          className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
      </div>

      {/* Header with Icon */}
      <div className="mb-8 text-center">
        <div className="w-14 h-14 bg-emerald-50 text-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
          <MailCheck className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          Verify Your Email
        </h1>
        <p className="text-slate-500 text-sm">
          We&apos;ve sent a 6-digit verification code to
        </p>
        <p className="font-semibold text-slate-800 text-sm mt-0.5 break-all">
          {email || "your registered email"}
        </p>
      </div>

      {/* Reason notice if unverified user attempted login */}
      {reason === "unverified" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <span>Please verify your email address to activate and log in to your account.</span>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleVerify} className="space-y-6">
        
        {/* OTP Input Boxes */}
        <div>
          <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Enter 6-Digit Code
          </label>
          <div className="flex justify-between gap-2 sm:gap-2.5">
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
                className="w-12 h-13 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all shadow-xs"
              />
            ))}
          </div>
        </div>

        {/* Verify Button */}
        <button
          type="submit"
          disabled={loading || otp.join("").length < 6}
          className="w-full py-3.5 px-4 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Verify Email"
          )}
        </button>
      </form>

      {/* Resend OTP */}
      <div className="text-center mt-6 text-sm text-slate-500">
        Didn&apos;t receive the code?{" "}
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-green-600 hover:text-green-700 hover:underline cursor-pointer disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend Code"}
          </button>
        ) : (
          <span className="text-slate-400 font-medium">
            Resend in {countdown}s
          </span>
        )}
      </div>

      {/* Change email or back to register */}
      <div className="text-center text-xs text-slate-400 mt-6">
        Entered the wrong email?{" "}
        <Link href="/signup" className="text-slate-600 hover:text-slate-900 underline font-medium">
          Register with a different email
        </Link>
      </div>

    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center font-sans antialiased">
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="text-slate-400 text-sm">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </main>
    </div>
  );
}
