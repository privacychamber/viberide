"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { User, Shield, LogOut, Compass, FileText, Calendar, PlusCircle } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="glass-nav sticky top-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-between text-snow-white">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2">
        <span className="font-heading font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sunset-orange to-amber-500">
          VIBERIDE
        </span>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link
          href="/explore"
          className={`flex items-center gap-1.5 transition-colors hover:text-sunset-orange ${
            isActive("/explore") ? "text-sunset-orange" : "text-gray-300"
          }`}
        >
          <Compass className="w-4 h-4" />
          Explore
        </Link>
        {session && (
          <>
            <Link
              href="/bookings"
              className={`flex items-center gap-1.5 transition-colors hover:text-sunset-orange ${
                isActive("/bookings") ? "text-sunset-orange" : "text-gray-300"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Bookings
            </Link>
            <Link
              href="/owner"
              className={`flex items-center gap-1.5 transition-colors hover:text-sunset-orange ${
                isActive("/owner") ? "text-sunset-orange" : "text-gray-300"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Owner Dashboard
            </Link>
            {session.user.role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 transition-colors hover:text-sunset-orange ${
                  isActive("/admin") ? "text-sunset-orange" : "text-gray-300"
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </>
        )}
      </div>

      {/* Session Controls */}
      <div className="flex items-center gap-4">
        {session ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 bg-mountain-black-light hover:bg-forest-green-dark px-3 py-1.5 rounded-full border border-white/10 transition-all"
            >
              <User className="w-4 h-4 text-sunset-orange" />
              <span className="hidden sm:inline text-xs font-semibold">
                {session.user.name}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  session.user.verified ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                }`}
                title={session.user.verified ? "Verified User" : "Verification Pending"}
              />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-full border border-white/5 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="bg-gradient-to-r from-forest-green-light to-forest-green px-5 py-2 rounded-full font-semibold text-sm hover:from-sunset-orange hover:to-sunset-orange-dark hover:scale-105 shadow-md shadow-black/30 transition-all"
          >
            Login / Signup
          </Link>
        )}
      </div>
    </nav>
  );
}
