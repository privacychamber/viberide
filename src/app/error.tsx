"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Viberide Global Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-mountain-black flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-mountain-black-light border border-white/5 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10" />
        </div>
        
        <div>
          <h2 className="font-heading font-black text-2xl text-snow-white mb-2">Oops, something broke!</h2>
          <p className="text-gray-400 text-sm">
            We encountered an unexpected error while trying to load this page.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-sunset-orange hover:bg-sunset-orange-dark text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full bg-white/5 hover:bg-white/10 text-snow-white font-bold py-3 rounded-xl transition-colors inline-block"
          >
            Go back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
