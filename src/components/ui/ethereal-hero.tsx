"use client";

import Link from "next/link";
import { Component } from "@/components/ui/ethereal-shadow";

export default function EtherealHero() {
  // Convert primary color to rgba format for the shadow component
  // primary: #f9a8d4 → rgba(249, 168, 212, 1)
  const primaryColor = "rgba(249, 168, 212, 1)";

  return (
    <section className="relative min-h-screen overflow-hidden">
      <Component
        color={primaryColor}
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.3, scale: 1.2 }}
        sizing="fill"
        className="min-h-screen"
      >
        <div className="container mx-auto px-4 text-center relative z-20">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
            Welcome to{" "}
            <span className="bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm">
              OpSale
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-2xl mx-auto">
            Discover the latest fashion trends. Style that speaks to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-block px-8 py-4 bg-white text-primary rounded-none font-semibold hover:bg-gray-50 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Shop Now
            </Link>
            <Link
              href="/about"
              className="inline-block px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-none font-semibold hover:bg-white/20 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </Component>
    </section>
  );
}
