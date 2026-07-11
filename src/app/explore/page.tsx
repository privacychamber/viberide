import Link from "next/link";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import VehicleCard from "@/components/VehicleCard";
import dbConnect from "@/lib/dbConnect";
import Vehicle from "@/models/Vehicle";
import { Filter, Search, RotateCcw, AlertCircle } from "lucide-react";

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
  },
  {
    _id: "fb_ktm",
    title: "KTM Duke 390",
    type: "bike" as const,
    brand: "KTM",
    model: "Duke 390",
    pricePerDay: 2200,
    location: { area: "Bhagsu", city: "Dharamshala", state: "Himachal Pradesh", country: "India" },
    images: ["https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 373, fuelType: "Petrol", transmission: "Geared", seatingCapacity: 2, deliveryAvailable: false }
  },
  {
    _id: "fb_access",
    title: "Suzuki Access 125 SE",
    type: "scooter" as const,
    brand: "Suzuki",
    model: "Access 125",
    pricePerDay: 500,
    location: { area: "Dharamkot", city: "Dharamshala", state: "Himachal Pradesh", country: "India" },
    images: ["https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=800&q=80"],
    specs: { engineCc: 124, fuelType: "Petrol", transmission: "Non-Geared", seatingCapacity: 2, deliveryAvailable: true }
  },
  {
    _id: "fb_ather",
    title: "Ather 450X Gen 3 (Electric)",
    type: "scooter" as const,
    brand: "Ather",
    model: "450X",
    pricePerDay: 700,
    location: { area: "Bir Colony", city: "Bir", state: "Himachal Pradesh", country: "India" },
    images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80"],
    specs: { fuelType: "Electric", transmission: "Automatic", seatingCapacity: 2, deliveryAvailable: true }
  }
];

interface PageProps {
  searchParams: Promise<{
    query?: string;
    type?: string;
    city?: string;
    transmission?: string;
    fuel?: string;
    delivery?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.query || "";
  const type = resolvedSearchParams.type || "";
  const city = resolvedSearchParams.city || "";
  const transmission = resolvedSearchParams.transmission || "";
  const fuel = resolvedSearchParams.fuel || "";
  const delivery = resolvedSearchParams.delivery || "";

  let vehicles: any[] = [];
  let isDbConnectionError = false;

  try {
    await dbConnect();

    // Build DB Query - only show approved vehicles
    const dbQuery: any = { status: "approved" };
    if (type) dbQuery.type = type;
    if (city) dbQuery["location.city"] = city;
    if (transmission) dbQuery["specs.transmission"] = transmission;
    if (fuel) dbQuery["specs.fuelType"] = fuel;
    if (delivery === "true") dbQuery["specs.deliveryAvailable"] = true;

    if (query) {
      dbQuery.$or = [
        { title: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { model: { $regex: query, $options: "i" } },
      ];
    }

    const dbVehicles = await Vehicle.find(dbQuery).lean();
    vehicles = dbVehicles.map(v => ({
      ...v,
      _id: v._id.toString(),
      owner: v.owner.toString(),
      createdAt: undefined,
      updatedAt: undefined
    }));
  } catch (error) {
    console.error("Database fetch failed, filtering fallbacks:", error);
    isDbConnectionError = true;

    // Filter fallback vehicles in-memory
    vehicles = FALLBACK_VEHICLES.filter(v => {
      if (type && v.type !== type) return false;
      if (city && v.location.city !== city) return false;
      if (transmission && v.specs.transmission !== transmission) return false;
      if (fuel && v.specs.fuelType !== fuel) return false;
      if (delivery === "true" && !v.specs.deliveryAvailable) return false;
      if (query) {
        const queryLower = query.toLowerCase();
        const matchesTitle = v.title.toLowerCase().includes(queryLower);
        const matchesBrand = v.brand.toLowerCase().includes(queryLower);
        const matchesModel = v.model.toLowerCase().includes(queryLower);
        if (!matchesTitle && !matchesBrand && !matchesModel) return false;
      }
      return true;
    });
  }

  // Active filters helper count
  const activeFiltersCount =
    (type ? 1 : 0) +
    (city ? 1 : 0) +
    (transmission ? 1 : 0) +
    (fuel ? 1 : 0) +
    (delivery ? 1 : 0);

  return (
    <div className="flex flex-col min-h-screen bg-mountain-black text-snow-white pb-24 md:pb-0">
      <Navbar />

      {/* Main Container */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 bg-mountain-black-light border border-white/5 p-6 rounded-2xl h-fit">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h2 className="font-heading font-extrabold text-lg flex items-center gap-2">
              <Filter className="w-4 h-4 text-sunset-orange" />
              <span>Filters</span>
            </h2>
            {activeFiltersCount > 0 && (
              <Link
                href="/explore"
                className="text-[10px] text-gray-500 hover:text-sunset-orange flex items-center gap-1.5 transition-colors font-bold uppercase"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Link>
            )}
          </div>

          <form method="GET" action="/explore" className="space-y-6">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  name="query"
                  defaultValue={query}
                  placeholder="e.g. Himalayan, Thar"
                  className="w-full bg-mountain-black border border-white/10 rounded-xl px-3 py-2 text-sm text-snow-white focus:outline-none focus:border-forest-green-light"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-gray-500 hover:text-snow-white">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* City Select */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">City</label>
              <select
                name="city"
                defaultValue={city}
                onChange={(e) => e.target.form?.submit()}
                className="w-full bg-mountain-black border border-white/10 rounded-xl px-3 py-2 text-sm text-snow-white focus:outline-none focus:border-forest-green-light"
              >
                <option value="">All Cities</option>
                <option value="Dharamshala">Dharamshala</option>
                <option value="Bir">Bir Billing</option>
                <option value="Manali">Manali</option>
                <option value="Shimla">Shimla</option>
                <option value="Kasol">Kasol / Parvati Valley</option>
                <option value="Dalhousie">Dalhousie</option>
              </select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Vehicle Type</label>
              <select
                name="type"
                defaultValue={type}
                onChange={(e) => e.target.form?.submit()}
                className="w-full bg-mountain-black border border-white/10 rounded-xl px-3 py-2 text-sm text-snow-white focus:outline-none focus:border-forest-green-light"
              >
                <option value="">All Types</option>
                <option value="scooter">Scooter</option>
                <option value="bike">Motorcycle</option>
                <option value="car">SUV / Car</option>
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Transmission</label>
              <select
                name="transmission"
                defaultValue={transmission}
                onChange={(e) => e.target.form?.submit()}
                className="w-full bg-mountain-black border border-white/10 rounded-xl px-3 py-2 text-sm text-snow-white focus:outline-none focus:border-forest-green-light"
              >
                <option value="">All</option>
                <option value="Geared">Geared</option>
                <option value="Non-Geared">Non-Geared</option>
                <option value="Manual">Manual (Car)</option>
                <option value="Automatic">Automatic (Car/EV)</option>
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Fuel Type</label>
              <select
                name="fuel"
                defaultValue={fuel}
                onChange={(e) => e.target.form?.submit()}
                className="w-full bg-mountain-black border border-white/10 rounded-xl px-3 py-2 text-sm text-snow-white focus:outline-none focus:border-forest-green-light"
              >
                <option value="">All</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
              </select>
            </div>

            {/* Delivery Switch */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold uppercase text-gray-500">Delivery Available</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="delivery"
                  value="true"
                  defaultChecked={delivery === "true"}
                  onChange={(e) => e.target.form?.submit()}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest-green-light peer-checked:after:bg-snow-white" />
              </label>
            </div>

            {/* Hidden field triggers to preserve other filters on text search */}
            {query && <input type="hidden" name="query" value={query} />}
          </form>
        </aside>

        {/* Listings Grid */}
        <main className="flex-1">
          {isDbConnectionError && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>
                Running in Offline Fallback Mode. Connect MongoDB to query live database listings. Trigger seeding by visiting{" "}
                <Link href="/api/seed" className="underline font-bold text-snow-white">
                  /api/seed
                </Link>
                .
              </span>
            </div>
          )}

          {/* Results Summary */}
          <div className="mb-6 flex justify-between items-center text-xs text-gray-400">
            <span>
              Showing <strong className="text-snow-white">{vehicles.length}</strong> vehicles in Dharamshala & Bir
            </span>
          </div>

          {/* Grid Layout */}
          {vehicles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle._id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-mountain-black-light/30 border border-dashed border-white/5 rounded-2xl">
              <p className="text-base text-gray-400 mb-2">No vehicles match your search filters.</p>
              <p className="text-xs text-gray-600">Try adjusting your query or resetting filters.</p>
              <Link
                href="/explore"
                className="mt-6 inline-flex bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-semibold text-snow-white transition-all"
              >
                Clear All Filters
              </Link>
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
