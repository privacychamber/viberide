import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0b0f0b] text-[#f8f9fa] selection:bg-sunset-orange selection:text-white">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center">
        <h1 className="font-heading font-black text-5xl md:text-6xl text-white mb-6">Careers</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">This page is currently under construction. Please check back later for updates!</p>
        <Link href="/" className="inline-block bg-sunset-orange hover:bg-sunset-orange-dark text-white font-bold py-3 px-8 rounded-full transition-colors">Return Home</Link>
      </main>
      <BottomNav />
    </div>
  );
}
