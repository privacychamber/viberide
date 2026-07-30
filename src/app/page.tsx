import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import VehicleCard from "@/components/VehicleCard";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";
import { Compass, ShieldCheck, MapPin, Zap, MessageSquare, ArrowRight, Search, Star, Shield, Clock } from "lucide-react";

// Static fallback items to ensure the app works beautifully even before DB is seeded or connected
const FALLBACK_VEHICLES = [
  {
    _id: "fb_himalayan",
    title: "Royal Enfield Himalayan 450",
    type: "bike" as const,
    brand: "Royal Enfield",
    model: "Himalayan 450",
    pricePerDay: 1800,
    location: { area: "McLeod Ganj", city: "Dharamshala", state: "Himachal Pradesh", country: "India" },
    images: ["https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 450, fuelType: "Petrol", transmission: "Geared", seatingCapacity: 2, deliveryAvailable: true }
  },
  {
    _id: "fb_activa",
    title: "Honda Activa 6G (Matte Grey)",
    type: "scooter" as const,
    brand: "Honda",
    model: "Activa 6G",
    pricePerDay: 450,
    location: { area: "Bir Colony", city: "Bir", state: "Himachal Pradesh", country: "India" },
    images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 110, fuelType: "Petrol", transmission: "Non-Geared", seatingCapacity: 2, deliveryAvailable: true }
  },
  {
    _id: "fb_thar",
    title: "Mahindra Thar 4x4 (Hard Top)",
    type: "car" as const,
    brand: "Mahindra",
    model: "Thar 4x4",
    pricePerDay: 3500,
    location: { area: "Landing Site", city: "Bir", state: "Himachal Pradesh", country: "India" },
    images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 2184, fuelType: "Diesel", transmission: "Manual", seatingCapacity: 4, deliveryAvailable: true }
  }
];

async function getFeaturedVehicles() {
  try {
    await dbConnect();
    const dbVehicles = await Vehicle.find({}).limit(3).lean();
    if (dbVehicles && dbVehicles.length > 0) {
      return dbVehicles.map((v: any) => ({
        ...v,
        _id: v._id.toString(),
        owner: v.owner.toString(),
        createdAt: undefined,
        updatedAt: undefined
      }));
    }
  } catch (error) {
    console.error("Failed to fetch vehicles from DB, falling back:", error);
  }
  return FALLBACK_VEHICLES;
}

export default async function Home() {
  const vehicles = await getFeaturedVehicles();

  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0 overflow-x-hidden">
      <Navbar />

      {/* NEW HERO SECTION - 2 Column Layout */}
      <header className="relative w-full min-h-[90vh] flex flex-col md:flex-row items-center justify-between px-6 sm:px-12 md:px-20 pt-24 pb-12">
        {/* Left Column - Typography & Search */}
        <div className="relative z-10 w-full md:w-1/2 flex flex-col items-start pt-10 md:pt-0">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-green-dark/30 border border-forest-green/30 text-xs font-semibold text-forest-green-light">
            <span className="w-2 h-2 rounded-full bg-forest-green-light animate-pulse" />
            Viberide Rental Network
          </div>
          
          <h1 className="font-heading font-black text-6xl md:text-[5.5rem] tracking-tighter leading-[0.9] text-snow-white mb-6">
            Explore <br />
            Himachal's <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset-orange to-amber-400">
              Open Roads
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-md mb-10 leading-relaxed font-medium">
            Rent scooters, motorcycles, and SUVs directly from local hosts. Verified, secure, and ready for your next adventure.
          </p>

          {/* Upwork Style Floating Search Pill */}
          <form action="/explore" className="relative flex items-center w-full max-w-lg bg-white rounded-full p-2 shadow-[0_0_40px_rgba(255,122,69,0.15)] group">
            <div className="flex-1 flex items-center pl-4">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input 
                type="text" 
                placeholder="Where are you going?" 
                name="city"
                className="w-full bg-transparent border-none outline-none text-mountain-black font-semibold placeholder:text-gray-400 placeholder:font-medium"
              />
            </div>
            <button
              type="submit"
              className="bg-mountain-black text-snow-white hover:bg-sunset-orange px-8 py-3 rounded-full font-bold text-sm transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Right Column - Bleeding 3D Image */}
        <div className="absolute top-0 right-0 w-full md:w-3/5 h-full opacity-30 md:opacity-100 -z-0 md:z-10 pointer-events-none flex items-center justify-end">
          <div className="relative w-full h-[120%] -mr-[10%] mt-[-10%] mix-blend-screen md:mix-blend-normal">
             <Image 
                src="/hero-knot.png" 
                alt="Abstract 3D Shape" 
                fill
                className="object-cover md:object-contain object-right transform scale-110 md:scale-125"
                priority
             />
          </div>
          {/* subtle gradient fade for blending on mobile */}
          <div className="absolute inset-0 bg-gradient-to-r from-mountain-black to-transparent md:hidden" />
        </div>
      </header>


      {/* BENTO BOX GRID: Categories & Trust */}
      <section className="py-20 px-6 sm:px-12 md:px-20 max-w-[1440px] mx-auto w-full z-10 relative">
        <div className="mb-12">
          <h2 className="font-heading font-black text-4xl md:text-5xl text-snow-white tracking-tight">
            Everything you need. <br />
            <span className="text-gray-500">Right where you need it.</span>
          </h2>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[250px]">
          
          {/* Large Feature Card (Spans 2 cols, 2 rows) */}
          <Link href="/explore?type=bike" className="md:col-span-2 md:row-span-2 group relative rounded-3xl overflow-hidden border border-white/10 bg-mountain-black-light hover:border-sunset-orange/50 transition-colors p-8 flex flex-col justify-end">
            <Image 
              src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80" 
              alt="Motorcycles" 
              fill
              className="object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500 group-hover:scale-105"
            />
            <div className="absolute top-6 left-6 bg-sunset-orange text-mountain-black text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-lg">
              Most Popular
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-2">Motorcycles</h3>
              <p className="text-gray-300 font-medium max-w-sm">Conquer the mountain passes with our premium fleet of adventure bikes.</p>
            </div>
          </Link>

          {/* Standard Bento Card */}
          <Link href="/explore?type=scooter" className="group relative rounded-3xl overflow-hidden border border-white/10 bg-mountain-black-light hover:border-white/20 transition-all p-6 flex flex-col">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-forest-green/20 rounded-full blur-2xl group-hover:bg-forest-green/40 transition-colors" />
            <div className="bg-forest-green/20 w-12 h-12 rounded-full flex items-center justify-center text-forest-green-light mb-auto relative z-10">
              <Compass className="w-6 h-6" />
            </div>
            <div className="relative z-10 mt-6">
              <h3 className="text-xl font-bold mb-1">Scooters</h3>
              <p className="text-sm text-gray-400">Perfect for local cafe hopping and city rides.</p>
            </div>
          </Link>

          {/* Standard Bento Card */}
          <Link href="/explore?type=car" className="group relative rounded-3xl overflow-hidden border border-white/10 bg-mountain-black-light hover:border-white/20 transition-all p-6 flex flex-col">
            <div className="absolute top-4 right-4 bg-[#2d5a27] text-snow-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full z-10">
              Groups
            </div>
            <div className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center text-white mb-auto relative z-10">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="relative z-10 mt-6">
              <h3 className="text-xl font-bold mb-1">SUVs & Cars</h3>
              <p className="text-sm text-gray-400">Comfort and space for families and groups.</p>
            </div>
          </Link>

          {/* Trust Feature Card (Spans 2 cols) */}
          <div className="md:col-span-2 relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-mountain-black-light to-mountain-black p-8 flex items-center justify-between group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
            <div className="relative z-10 max-w-sm">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-emerald-400 w-5 h-5" />
                <span className="text-emerald-400 font-bold text-sm tracking-wide">100% SECURE</span>
              </div>
              <h3 className="text-2xl font-black mb-2">Verified Hosts & Instant KYC</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Skip the paperwork. Upload your documents securely and get approved in minutes. All our hosts are locally vetted for safety and quality.</p>
            </div>
            <div className="hidden md:flex relative z-10 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md transform rotate-3 group-hover:rotate-0 transition-transform">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="font-bold text-snow-white">Verified Profile</p>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Rentals */}
      <section className="py-20 px-6 sm:px-12 md:px-20 max-w-[1440px] mx-auto w-full border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="font-heading font-black text-3xl md:text-4xl text-snow-white tracking-tight mb-2">
              Featured Rides
            </h2>
            <p className="text-gray-500 font-medium">Handpicked, highly-rated vehicles available near you.</p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-snow-white px-6 py-3 rounded-full font-bold text-sm transition-all"
          >
            View Full Fleet
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((vehicle: any) => (
            <VehicleCard key={vehicle._id} vehicle={vehicle} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 sm:px-12 md:px-20 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="font-heading font-black text-2xl tracking-tighter mb-1">Viberide.</h3>
            <p className="text-xs text-gray-500 font-medium max-w-xs">Connecting adventure seekers with reliable local vehicles across Himachal Pradesh.</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
               <p className="text-snow-white font-bold text-sm mb-1">Legal</p>
               <div className="flex gap-4 text-xs text-gray-500">
                 <Link href="#" className="hover:text-snow-white">Privacy</Link>
                 <Link href="#" className="hover:text-snow-white">Terms</Link>
               </div>
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
