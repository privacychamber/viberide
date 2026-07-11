import Link from "next/link";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import VehicleCard from "@/components/VehicleCard";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";
import { Compass, ShieldCheck, MapPin, Zap, MessageSquare, ArrowRight } from "lucide-react";

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
      return dbVehicles.map(v => ({
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
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
      <Navbar />

      {/* Hero Section */}
      <header className="relative py-24 md:py-36 px-4 sm:px-8 text-center flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-forest-green-dark/30 via-mountain-black to-mountain-black z-0" />
        
        {/* Visual Background image overlay */}
        <div 
          className="absolute inset-0 opacity-15 mix-blend-overlay bg-cover bg-center z-0 pointer-events-none"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80')" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-sunset-orange mb-6 hover:scale-105 transition-transform">
            <Compass className="w-3.5 h-3.5" />
            <span>Himachal's Hyperlocal Rental Platform</span>
          </div>

          <h1 className="font-heading font-black text-4xl sm:text-6xl tracking-tight leading-tight text-snow-white mb-6">
            Discover Dharamshala & Bir <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset-orange via-amber-500 to-emerald-400">
              On Your Own Wheels
            </span>
          </h1>

          <p className="text-gray-400 text-base sm:text-xl max-w-2xl mb-10 leading-relaxed">
            Rent scooters, motorcycles, and SUVs directly from local hosts. Fully verified documents, instant booking confirmation, and airport delivery.
          </p>

          {/* Quick Search CTA */}
          <form action="/explore" className="w-full max-w-md bg-mountain-black-light/80 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-2xl">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 text-left">
              <MapPin className="w-5 h-5 text-sunset-orange shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Select City</p>
                <select name="city" className="bg-transparent text-sm font-semibold text-snow-white focus:outline-none border-none p-0 cursor-pointer w-full">
                  <option className="bg-mountain-black-light text-snow-white" value="">All Himachal</option>
                  <option className="bg-mountain-black-light text-snow-white" value="Dharamshala">Dharamshala</option>
                  <option className="bg-mountain-black-light text-snow-white" value="Bir">Bir</option>
                  <option className="bg-mountain-black-light text-snow-white" value="Manali">Manali</option>
                  <option className="bg-mountain-black-light text-snow-white" value="Shimla">Shimla</option>
                  <option className="bg-mountain-black-light text-snow-white" value="Kasol">Kasol</option>
                  <option className="bg-mountain-black-light text-snow-white" value="Dalhousie">Dalhousie</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-sunset-orange to-sunset-orange-dark hover:scale-102 hover:shadow-lg hover:shadow-sunset-orange/20 text-snow-white py-3 sm:py-0 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              Browse Vehicles
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Vehicle Categories */}
      <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <h2 className="font-heading font-extrabold text-2xl text-snow-white mb-8 flex items-center gap-2">
          <span>Choose Your Category</span>
          <span className="w-1.5 h-1.5 rounded-full bg-sunset-orange" />
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/explore?type=scooter"
            className="group relative bg-mountain-black-light border border-white/5 hover:border-forest-green p-6 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-forest-green-dark/10 rounded-full blur-xl group-hover:bg-forest-green/20 transition-colors" />
            <div className="w-10 h-10 rounded-xl bg-forest-green/10 flex items-center justify-center text-forest-green-light font-bold">🛵</div>
            <div>
              <h3 className="font-bold text-base text-snow-white">Scooters</h3>
              <p className="text-xs text-gray-500">Perfect for local commuting. From ₹400/day.</p>
            </div>
          </Link>

          <Link
            href="/explore?type=bike"
            className="group relative bg-mountain-black-light border border-white/5 hover:border-forest-green p-6 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-colors" />
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold">🏍️</div>
            <div>
              <h3 className="font-bold text-base text-snow-white">Motorbikes</h3>
              <p className="text-xs text-gray-500">Ride the mountain bends. From ₹900/day.</p>
            </div>
          </Link>

          <Link
            href="/explore?type=car"
            className="group relative bg-mountain-black-light border border-white/5 hover:border-forest-green p-6 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-sunset-orange/10 rounded-full blur-xl group-hover:bg-sunset-orange/20 transition-colors" />
            <div className="w-10 h-10 rounded-xl bg-sunset-orange/10 flex items-center justify-center text-sunset-orange font-bold">🚗</div>
            <div>
              <h3 className="font-bold text-base text-snow-white">SUVs & Cars</h3>
              <p className="text-xs text-gray-500">Comfort for families & groups. From ₹2500/day.</p>
            </div>
          </Link>

          <Link
            href="/explore?fuel=Electric"
            className="group relative bg-mountain-black-light border border-white/5 hover:border-forest-green p-6 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold">⚡</div>
            <div>
              <h3 className="font-bold text-base text-snow-white">EV Rentals</h3>
              <p className="text-xs text-gray-500">Go green in the valley. From ₹600/day.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Rentals */}
      <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-snow-white flex items-center gap-2">
              <span>Featured Rides</span>
              <span className="w-1.5 h-1.5 rounded-full bg-forest-green-light" />
            </h2>
            <p className="text-xs text-gray-500 mt-1">Handpicked quality-verified vehicles nearby.</p>
          </div>
          <Link
            href="/explore"
            className="text-xs font-bold text-sunset-orange hover:text-snow-white hover:underline transition-colors flex items-center gap-1"
          >
            See All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle: any) => (
            <VehicleCard key={vehicle._id} vehicle={vehicle} />
          ))}
        </div>
      </section>

      {/* How It Works & Trust Features */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-snow-white mb-3">
            Why Rent with Viberide?
          </h2>
          <p className="text-sm text-gray-500">
            A trustworthy hyperlocal community built specifically for long-stay nomads and adventure seekers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-mountain-black-light/50 border border-white/5 p-6 rounded-2xl flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-forest-green/10 text-forest-green-light shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-snow-white mb-2">Instant KYC Verification</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Upload your driving license and selfie. Our automated queue gets you verified quickly so you can start riding.
              </p>
            </div>
          </div>

          <div className="bg-mountain-black-light/50 border border-white/5 p-6 rounded-2xl flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-sunset-orange/10 text-sunset-orange shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-snow-white mb-2">Doorstep Delivery</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Filter by vehicles that support delivery. Have your scooter or motorcycle dropped off right at your hostel, cafe, or homestay.
              </p>
            </div>
          </div>

          <div className="bg-mountain-black-light/50 border border-white/5 p-6 rounded-2xl flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-snow-white mb-2">Direct Owner Chat</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Connect directly with local owners via WhatsApp as soon as your booking is approved. Get support and tips from local hosts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-mountain-black-light/20 border-t border-white/5 text-center text-xs text-gray-600">
        <p className="mb-2">© {new Date().getFullYear()} Viberide Rental Technologies. Made with ❤️ in Himachal.</p>
        <p className="text-[10px] text-gray-700">Providing self-drive scooty, bike, and car rental service in McLeod Ganj, Bhagsu, Dharamkot, Bir Colony, and Landing Site.</p>
      </footer>

      <BottomNav />
    </div>
  );
}
