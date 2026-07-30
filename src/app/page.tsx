import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import VehicleCard from "@/components/VehicleCard";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";
import { Compass, ShieldCheck, MapPin, Zap, MessageSquare, ArrowRight, Search, Star, Shield, Clock, Calendar, ChevronDown, CheckCircle2, Navigation, Headphones, ChevronRight, Apple, Play } from "lucide-react";

// Static fallback items to ensure the app works beautifully even before DB is seeded or connected
const FALLBACK_VEHICLES = [
  {
    _id: "fb_himalayan",
    title: "Royal Enfield Himalayan 450",
    type: "bike" as const,
    brand: "Royal Enfield",
    model: "Himalayan 450",
    pricePerDay: 1800,
    location: { area: "Anjuna Beach", city: "Goa", state: "Goa", country: "India" },
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
    location: { area: "Indiranagar", city: "Bangalore", state: "Karnataka", country: "India" },
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
    location: { area: "Connaught Place", city: "Delhi", state: "Delhi", country: "India" },
    images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 2184, fuelType: "Diesel", transmission: "Manual", seatingCapacity: 4, deliveryAvailable: true }
  }
];

async function getFeaturedVehicles() {
  try {
    await dbConnect();
    const dbVehicles = await Vehicle.find({}).limit(4).lean();
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
    <div className="flex flex-col min-h-screen bg-[#0b0f0b] text-[#f8f9fa] pb-24 md:pb-0 overflow-x-hidden selection:bg-sunset-orange selection:text-white">
      <Navbar />

      {/* 1. ADVANCED HERO SECTION */}
      <header className="relative w-full min-h-[95vh] flex flex-col justify-center px-4 sm:px-10 md:px-16 lg:px-24 pt-32 pb-20 border-b border-white/5">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/hero-vehicle.png" 
            alt="Viberide Premium Vehicles" 
            fill
            className="object-cover object-[70%_center] opacity-40 mix-blend-screen"
            priority
          />
          {/* Gradients to blend image perfectly into the dark background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f0b] via-[#0b0f0b]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f0b] via-transparent to-[#0b0f0b]" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-start">
          
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-green-dark/40 border border-forest-green/50 text-[10px] sm:text-xs font-bold text-forest-green-light uppercase tracking-widest backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-green-light animate-pulse" />
            India's Premier Rental Network 🇮🇳
          </div>
          
          <h1 className="font-heading font-black text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] tracking-tighter leading-[0.95] text-white mb-8 max-w-4xl">
            Explore India's <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset-orange to-amber-400 drop-shadow-[0_0_30px_rgba(255,122,69,0.3)]">
              Open Roads
            </span>
          </h1>

          <p className="text-gray-300 text-base sm:text-lg md:text-xl max-w-xl mb-8 leading-relaxed font-medium">
            Rent scooters, motorcycles, and SUVs directly from verified local hosts. Safe, secure, and ready for your next adventure.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-12">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant Booking
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-300">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Verified Hosts
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-300">
              <Shield className="w-4 h-4 text-blue-500" /> Secure Payments
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-300">
              <Headphones className="w-4 h-4 text-sunset-orange" /> 24×7 Support
            </div>
          </div>

          {/* Complex Multi-Input Search Bar */}
          <form action="/explore" className="w-full max-w-5xl bg-[#141a14]/90 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-full p-2 flex flex-col md:flex-row items-center gap-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
            
            <div className="flex-1 flex items-center gap-3 px-4 py-3 w-full border-b md:border-b-0 md:border-r border-white/10">
              <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex flex-col w-full">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Where</label>
                <input type="text" name="city" placeholder="Enter city or location" className="bg-transparent border-none outline-none text-white font-semibold text-sm w-full placeholder:text-gray-300" />
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3 px-4 py-3 w-full border-b md:border-b-0 md:border-r border-white/10">
              <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex flex-col w-full">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Pick-up</label>
                <input type="text" placeholder="Tomorrow, 10:00 AM" className="bg-transparent border-none outline-none text-white font-semibold text-sm w-full placeholder:text-gray-300" />
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3 px-4 py-3 w-full border-b md:border-b-0 md:border-r border-white/10">
              <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex flex-col w-full">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Drop-off</label>
                <input type="text" placeholder="Sun, 18 May, 10:00 AM" className="bg-transparent border-none outline-none text-white font-semibold text-sm w-full placeholder:text-gray-300" />
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3 px-4 py-3 w-full">
              <Compass className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex flex-col w-full">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Vehicle Type</label>
                <select name="type" className="bg-transparent border-none outline-none text-white font-semibold text-sm w-full cursor-pointer appearance-none">
                  <option className="bg-[#141a14]" value="">All Vehicles</option>
                  <option className="bg-[#141a14]" value="scooter">Scooters</option>
                  <option className="bg-[#141a14]" value="bike">Motorcycles</option>
                  <option className="bg-[#141a14]" value="car">SUVs & Cars</option>
                </select>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
            </div>

            <button type="submit" className="w-full md:w-auto bg-gradient-to-r from-sunset-orange to-sunset-orange-dark hover:shadow-[0_0_20px_rgba(255,122,69,0.4)] text-white px-8 py-4 rounded-xl md:rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 shrink-0">
              <Search className="w-4 h-4" />
              Search Vehicles
            </button>
          </form>

          {/* Popular Searches */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-gray-500 font-bold flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-sunset-orange" /> Popular Searches:</span>
            {["Manali", "Leh", "Goa", "Mumbai", "Bangalore", "Jaipur", "Rishikesh", "Kerala", "Delhi"].map(city => (
              <Link key={city} href={`/explore?city=${city}`} className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5">
                {city}
              </Link>
            ))}
          </div>

        </div>
      </header>

      {/* 2. STATS BAR */}
      <section className="border-b border-white/5 bg-[#141a14]/50">
        <div className="max-w-[1440px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x divide-white/5">
          
          <div className="flex items-center gap-4 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-sunset-orange/10 flex items-center justify-center border border-sunset-orange/20 shrink-0">
              <Compass className="w-6 h-6 text-sunset-orange" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">50,000+</p>
              <p className="text-xs font-semibold text-gray-500">Vehicles Available</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-forest-green/10 flex items-center justify-center border border-forest-green/20 shrink-0">
              <MapPin className="w-6 h-6 text-forest-green-light" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">200+</p>
              <p className="text-xs font-semibold text-gray-500">Cities Across India</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-white flex items-center gap-1">4.9<Star className="w-4 h-4 fill-amber-500 text-amber-500" /></p>
              <p className="text-xs font-semibold text-gray-500">Average Rating (20k+)</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Headphones className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">24×7</p>
              <p className="text-xs font-semibold text-gray-500">Customer Support</p>
            </div>
          </div>

        </div>
      </section>


      {/* 3. CHOOSE YOUR ADVENTURE (Categories) */}
      <section className="py-20 px-6 sm:px-12 md:px-20 max-w-[1440px] mx-auto w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-heading font-black text-3xl text-white tracking-tight mb-2">Choose Your Adventure</h2>
            <p className="text-gray-500 text-sm font-medium">From city commutes to mountain escapes, find the perfect ride.</p>
          </div>
          <Link href="/explore" className="hidden sm:flex items-center gap-1 text-sm font-bold text-sunset-orange hover:text-sunset-orange-dark transition-colors">
            View All Categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Horizontal scroll container */}
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x">
          {[
            { name: "Scooters", icon: "🛵", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80" },
            { name: "Motorcycles", icon: "🏍️", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80" },
            { name: "SUVs & Cars", icon: "🚙", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80" },
            { name: "EV Rentals", icon: "⚡", image: "https://images.unsplash.com/photo-1593941707882-a5bba14938cb?auto=format&fit=crop&w=400&q=80" },
            { name: "Luxury Cars", icon: "✨", image: "https://images.unsplash.com/photo-1503376712394-6d9b0d4a9dc3?auto=format&fit=crop&w=400&q=80" },
            { name: "Road Trips", icon: "🛣️", image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80" },
            { name: "Weekend Getaways", icon: "🏕️", image: "https://images.unsplash.com/photo-1504280387927-31a89c316a30?auto=format&fit=crop&w=400&q=80" },
            { name: "Group Travel", icon: "🚌", image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80" },
          ].map((cat) => (
            <Link key={cat.name} href="/explore" className="relative shrink-0 w-36 h-36 rounded-3xl overflow-hidden group snap-start border border-white/5">
              <Image src={cat.image} alt={cat.name} fill className="object-cover opacity-50 group-hover:opacity-70 transition-opacity group-hover:scale-110 duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-0 p-4 flex flex-col justify-end items-center text-center">
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs font-bold text-white">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED RIDES */}
      <section className="pb-20 px-6 sm:px-12 md:px-20 max-w-[1440px] mx-auto w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-heading font-black text-3xl text-white tracking-tight mb-2">Featured Rides</h2>
            <p className="text-gray-500 text-sm font-medium">Handpicked, highly-rated vehicles available near you.</p>
          </div>
          <Link href="/explore" className="hidden sm:flex items-center gap-1 text-sm font-bold text-sunset-orange hover:text-sunset-orange-dark transition-colors">
            View Full Fleet <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.map((vehicle: any) => (
            <VehicleCard key={vehicle._id} vehicle={vehicle} />
          ))}
        </div>
      </section>

      {/* 5. WHY RENT WITH VIBERIDE? */}
      <section className="py-20 bg-[#141a14]/30 border-y border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 md:px-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading font-black text-3xl md:text-4xl text-white mb-4">Why Rent with Viberide?</h2>
            <p className="text-gray-400 font-medium">We make every journey safe, simple, and memorable with our premium service guarantees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-black/40 border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Verified & Trusted Hosts</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Every host is verified with KYC and trusted by thousands of travelers. Your safety is our absolute priority.</p>
            </div>

            <div className="bg-black/40 border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-sunset-orange/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-sunset-orange" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Doorstep Delivery</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Get your vehicle delivered to your location, on time every time. Hotels, airports, or railway stations.</p>
            </div>

            <div className="bg-black/40 border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-forest-green-light/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-forest-green-light" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Secure & Insured</h3>
              <p className="text-sm text-gray-400 leading-relaxed">All rides come with comprehensive insurance coverage and 24×7 roadside assistance anywhere in India.</p>
            </div>

            <div className="bg-black/40 border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Flexible & Hassle-free</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Free cancellation, easy modifications, and absolutely no hidden charges. Book with complete confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. EARN WITH YOUR VEHICLE (HOST CTA) */}
      <section className="py-20 px-6 sm:px-12 md:px-20 max-w-[1440px] mx-auto w-full">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-[#1b241b] to-[#0b0f0b] border border-white/10 flex flex-col md:flex-row items-center justify-between p-10 md:p-16 gap-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=1200&q=80')] opacity-10 mix-blend-overlay bg-cover bg-center"></div>
          
          <div className="relative z-10 max-w-xl">
            <h2 className="font-heading font-black text-4xl sm:text-5xl text-white tracking-tight mb-4">Earn with Your Vehicle</h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">Join thousands of hosts earning extra income by sharing their cars and bikes on Viberide when not in use.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/owner" className="bg-sunset-orange hover:bg-sunset-orange-dark text-white px-8 py-4 rounded-full font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,122,69,0.3)]">
                Become a Host
              </Link>
              <Link href="#" className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full font-bold text-sm transition-all border border-white/10">
                Learn More
              </Link>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-6 w-full max-w-sm">
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
               <div className="w-12 h-12 rounded-xl bg-sunset-orange/20 flex items-center justify-center text-sunset-orange shrink-0"><Compass className="w-6 h-6" /></div>
               <div>
                 <p className="font-bold text-white text-sm">High Earnings</p>
                 <p className="text-xs text-gray-500">Earn up to ₹50,000/month</p>
               </div>
             </div>
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
               <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><ShieldCheck className="w-6 h-6" /></div>
               <div>
                 <p className="font-bold text-white text-sm">100% Secure</p>
                 <p className="text-xs text-gray-500">Verified users, secure payments</p>
               </div>
             </div>
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
               <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0"><Headphones className="w-6 h-6" /></div>
               <div>
                 <p className="font-bold text-white text-sm">Host Support</p>
                 <p className="text-xs text-gray-500">Dedicated team for owners</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* 7. POPULAR CITIES */}
      <section className="pb-20 px-6 sm:px-12 md:px-20 max-w-[1440px] mx-auto w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-heading font-black text-3xl text-white tracking-tight mb-2">Popular Cities</h2>
            <p className="text-gray-500 text-sm font-medium">Explore vehicles across India's most loved destinations.</p>
          </div>
          <Link href="/explore" className="hidden sm:flex items-center gap-1 text-sm font-bold text-sunset-orange hover:text-sunset-orange-dark transition-colors">
            View All Cities <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Delhi", count: "15,000+ Vehicles", image: "https://images.unsplash.com/photo-1587474260580-5a3d76b1f24d?auto=format&fit=crop&w=400&q=80" },
            { name: "Mumbai", count: "12,000+ Vehicles", image: "https://images.unsplash.com/photo-1522204629497-6c2e39922e96?auto=format&fit=crop&w=400&q=80" },
            { name: "Bangalore", count: "10,000+ Vehicles", image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=400&q=80" },
            { name: "Goa", count: "8,500+ Vehicles", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=80" },
            { name: "Jaipur", count: "7,500+ Vehicles", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=400&q=80" },
            { name: "Manali", count: "6,300+ Vehicles", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=400&q=80" },
          ].map((city) => (
            <Link key={city.name} href={`/explore?city=${city.name}`} className="relative rounded-2xl overflow-hidden h-40 group cursor-pointer border border-white/5">
              <Image src={city.image} alt={city.name} fill className="object-cover opacity-50 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f0b] via-[#0b0f0b]/30 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="font-bold text-white text-lg">{city.name}</h3>
                <p className="text-[10px] text-gray-400 font-semibold">{city.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. APP PROMO BANNER */}
      <section className="pb-24 px-6 sm:px-12 md:px-20 max-w-[1440px] mx-auto w-full">
         <div className="bg-[#141a14] border border-white/5 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-full bg-forest-green-dark flex items-center justify-center border border-forest-green shrink-0">
                 <MapPin className="w-8 h-8 text-forest-green-light" />
               </div>
               <div>
                 <h2 className="font-heading font-black text-2xl sm:text-3xl text-white mb-2">The Viberide App</h2>
                 <p className="text-gray-400 text-sm">Your journey, in your pocket.<br/>Book, manage, and explore on the go.</p>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
               {/* QR Code Placeholder */}
               <div className="w-24 h-24 bg-white p-2 rounded-xl hidden lg:block">
                  <div className="w-full h-full border-4 border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 text-center font-bold">QR Code</div>
               </div>
               
               <div className="flex flex-col gap-3">
                 <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl transition-colors min-w-[200px]">
                    <Play className="w-6 h-6" />
                    <div className="text-left">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none">GET IT ON</p>
                      <p className="font-bold text-sm leading-tight">Google Play</p>
                    </div>
                 </button>
                 <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl transition-colors min-w-[200px]">
                    <Apple className="w-6 h-6 fill-white" />
                    <div className="text-left">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none">Download on the</p>
                      <p className="font-bold text-sm leading-tight">App Store</p>
                    </div>
                 </button>
               </div>
            </div>
         </div>
      </section>

      {/* 9. MEGA FOOTER */}
      <footer className="bg-[#141a14]/80 border-t border-white/5 pt-20 pb-10 px-6 sm:px-12 md:px-20">
        <div className="max-w-[1440px] mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
            <div className="lg:col-span-2">
              <h3 className="font-heading font-black text-3xl tracking-tighter mb-4 text-sunset-orange">VIBERIDE</h3>
              <p className="text-sm text-gray-400 font-medium max-w-xs leading-relaxed mb-6">Connecting adventure seekers with reliable local vehicles across India. Experience the freedom of the open road.</p>
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-sunset-orange cursor-pointer transition-colors"><MapPin className="w-4 h-4 text-white" /></div>
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-sunset-orange cursor-pointer transition-colors"><MessageSquare className="w-4 h-4 text-white" /></div>
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-sunset-orange cursor-pointer transition-colors"><Headphones className="w-4 h-4 text-white" /></div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Company</h4>
              <ul className="flex flex-col gap-4 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Press</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Services</h4>
              <ul className="flex flex-col gap-4 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Explore Vehicles</Link></li>
                <li><Link href="/owner" className="hover:text-sunset-orange transition-colors">Become a Host</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Business Rentals</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Airport Delivery</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Outstation Rentals</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Support</h4>
              <ul className="flex flex-col gap-4 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Safety</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Cancellation Policy</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Terms & Conditions</Link></li>
                <li><Link href="#" className="hover:text-sunset-orange transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Newsletter & Copyright */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 gap-6">
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} Viberide Rental Technologies. All rights reserved.</p>
            
            <div className="flex items-center gap-2">
              <input type="email" placeholder="Enter your email" className="bg-[#0b0f0b] border border-white/10 rounded-full px-6 py-2.5 text-sm text-white focus:outline-none focus:border-sunset-orange min-w-[250px]" />
              <button className="bg-sunset-orange text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-sunset-orange-dark transition-colors">Subscribe</button>
            </div>
            
            <p className="text-xs text-gray-600 flex items-center gap-1">Made with <span className="text-red-500">❤️</span> in India</p>
          </div>

        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
