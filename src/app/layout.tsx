import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Viberide | Self-Drive Vehicle Rental Dharamshala & Bir Billing",
  description: "Premium self-drive bike, scooter, and car rentals in Dharamshala, McLeod Ganj, Dharamkot, and Bir Billing. Perfect for digital nomads, paragliders, and tourists.",
  keywords: "self drive car rental, bike rental dharamshala, scooter rental bir billing, rent thar dharamshala, mcleodganj bike rent, scooty rent bir",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-mountain-black text-snow-white font-sans flex flex-col selection:bg-sunset-orange selection:text-snow-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
