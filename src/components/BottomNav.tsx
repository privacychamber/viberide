"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Compass, Calendar, PlusCircle, User } from "lucide-react";

export default function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-mountain-black-light/90 backdrop-blur-xl border-t border-white/5 px-6 py-2 pb-4 flex justify-between items-center text-gray-400 shadow-2xl">
      <Link href="/" className="flex flex-col items-center gap-1 transition-colors">
        <Home className={`w-5 h-5 ${isActive("/") ? "text-sunset-orange" : "text-gray-400"}`} />
        <span className={`text-[10px] ${isActive("/") ? "text-snow-white font-semibold" : "text-gray-500"}`}>
          Home
        </span>
      </Link>

      <Link href="/explore" className="flex flex-col items-center gap-1 transition-colors">
        <Compass className={`w-5 h-5 ${isActive("/explore") ? "text-sunset-orange" : "text-gray-400"}`} />
        <span className={`text-[10px] ${isActive("/explore") ? "text-snow-white font-semibold" : "text-gray-500"}`}>
          Explore
        </span>
      </Link>

      {session ? (
        <>
          <Link href="/bookings" className="flex flex-col items-center gap-1 transition-colors">
            <Calendar className={`w-5 h-5 ${isActive("/bookings") ? "text-sunset-orange" : "text-gray-400"}`} />
            <span className={`text-[10px] ${isActive("/bookings") ? "text-snow-white font-semibold" : "text-gray-500"}`}>
              Trips
            </span>
          </Link>

          <Link href="/owner" className="flex flex-col items-center gap-1 transition-colors">
            <PlusCircle className={`w-5 h-5 ${isActive("/owner") ? "text-sunset-orange" : "text-gray-400"}`} />
            <span className={`text-[10px] ${isActive("/owner") ? "text-snow-white font-semibold" : "text-gray-500"}`}>
              Host
            </span>
          </Link>

          <Link href="/profile" className="flex flex-col items-center gap-1 transition-colors">
            <User className={`w-5 h-5 ${isActive("/profile") ? "text-sunset-orange" : "text-gray-400"}`} />
            <span className={`text-[10px] ${isActive("/profile") ? "text-snow-white font-semibold" : "text-gray-500"}`}>
              Profile
            </span>
          </Link>
        </>
      ) : (
        <Link href="/login" className="flex flex-col items-center gap-1 transition-colors">
          <User className={`w-5 h-5 ${isActive("/login") ? "text-sunset-orange" : "text-gray-400"}`} />
          <span className={`text-[10px] ${isActive("/login") ? "text-snow-white font-semibold" : "text-gray-500"}`}>
            Login
          </span>
        </Link>
      )}
    </div>
  );
}
