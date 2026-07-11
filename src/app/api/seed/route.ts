import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Vehicle from "@/models/Vehicle";
import Booking from "@/models/Booking";

export async function GET() {
  try {
    await dbConnect();

    // 1. Clear existing data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Booking.deleteMany({});

    // 2. Create Users
    const admin = await User.create({
      name: "Admin Officer",
      phone: "9999999999",
      role: "admin",
      verified: true,
      license: { status: "verified" },
    });

    const owner1 = await User.create({
      name: "Amit Sharma (Dharamshala Rentals)",
      phone: "8888888888",
      role: "owner",
      verified: true,
      license: { status: "verified" },
    });

    const owner2 = await User.create({
      name: "Bir Adventure Wheels",
      phone: "7777777777",
      role: "owner",
      verified: true,
      license: { status: "verified" },
    });

    const renter = await User.create({
      name: "Rahul Nomad",
      phone: "6666666666",
      role: "renter",
      verified: true,
      license: {
        frontUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        backUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        status: "verified",
      },
    });

    // 3. Create Vehicles
    const vehiclesData = [
      {
        title: "Royal Enfield Himalayan 450",
        type: "bike" as const,
        brand: "Royal Enfield",
        model: "Himalayan 450",
        pricePerDay: 1800,
        location: {
          area: "McLeod Ganj",
          city: "Dharamshala",
          state: "Himachal Pradesh",
          country: "India"
        },
        images: [
          "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=800&q=80"
        ],
        owner: owner1._id,
        availability: true,
        status: "approved" as const,
        featured: true,
        documents: {
          rcUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
          insuranceUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        },
        specs: {
          engineCc: 450,
          fuelType: "Petrol" as const,
          transmission: "Geared" as const,
          seatingCapacity: 2,
          deliveryAvailable: true,
        },
      },
      {
        title: "Honda Activa 6G (Matte Grey)",
        type: "scooter" as const,
        brand: "Honda",
        model: "Activa 6G",
        pricePerDay: 450,
        location: {
          area: "Bir Colony",
          city: "Bir",
          state: "Himachal Pradesh",
          country: "India"
        },
        images: [
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80"
        ],
        owner: owner2._id,
        availability: true,
        status: "approved" as const,
        featured: true,
        documents: {
          rcUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
          insuranceUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        },
        specs: {
          engineCc: 110,
          fuelType: "Petrol" as const,
          transmission: "Non-Geared" as const,
          seatingCapacity: 2,
          deliveryAvailable: true,
        },
      },
      {
        title: "KTM Duke 390",
        type: "bike" as const,
        brand: "KTM",
        model: "Duke 390",
        pricePerDay: 2200,
        location: {
          area: "Bhagsu",
          city: "Dharamshala",
          state: "Himachal Pradesh",
          country: "India"
        },
        images: [
          "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80"
        ],
        owner: owner1._id,
        availability: true,
        status: "approved" as const,
        documents: {
          rcUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
          insuranceUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        },
        specs: {
          engineCc: 373,
          fuelType: "Petrol" as const,
          transmission: "Geared" as const,
          seatingCapacity: 2,
          deliveryAvailable: false,
        },
      },
      {
        title: "Mahindra Thar 4x4 (Hard Top)",
        type: "car" as const,
        brand: "Mahindra",
        model: "Thar 4x4",
        pricePerDay: 3500,
        location: {
          area: "Landing Site",
          city: "Bir",
          state: "Himachal Pradesh",
          country: "India"
        },
        images: [
          "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"
        ],
        owner: owner2._id,
        availability: true,
        status: "approved" as const,
        featured: true,
        documents: {
          rcUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
          insuranceUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        },
        specs: {
          engineCc: 2184,
          fuelType: "Diesel" as const,
          transmission: "Manual" as const,
          seatingCapacity: 4,
          deliveryAvailable: true,
        },
      },
      {
        title: "Suzuki Access 125 SE (Awaiting Review)",
        type: "scooter" as const,
        brand: "Suzuki",
        model: "Access 125",
        pricePerDay: 500,
        location: {
          area: "Dharamkot",
          city: "Dharamshala",
          state: "Himachal Pradesh",
          country: "India"
        },
        images: [
          "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=800&q=80"
        ],
        owner: owner1._id,
        availability: true,
        status: "pending" as const,
        documents: {
          rcUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
          insuranceUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        },
        specs: {
          engineCc: 124,
          fuelType: "Petrol" as const,
          transmission: "Non-Geared" as const,
          seatingCapacity: 2,
          deliveryAvailable: true,
        },
      },
      {
        title: "Ather 450X Gen 3 (Awaiting Review)",
        type: "scooter" as const,
        brand: "Ather",
        model: "450X",
        pricePerDay: 700,
        location: {
          area: "Bir Colony",
          city: "Bir",
          state: "Himachal Pradesh",
          country: "India"
        },
        images: [
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80"
        ],
        owner: owner2._id,
        availability: true,
        status: "pending" as const,
        documents: {
          rcUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
          insuranceUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
        },
        specs: {
          fuelType: "Electric" as const,
          transmission: "Automatic" as const,
          seatingCapacity: 2,
          deliveryAvailable: true,
        },
      }
    ];

    await Vehicle.create(vehiclesData);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      accountsCreated: {
        admin: "9999999999",
        owner1: "8888888888",
        owner2: "7777777777",
        renter: "6666666666",
        otpHint: "Any 6-digit OTP (e.g. 123456) is accepted."
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
