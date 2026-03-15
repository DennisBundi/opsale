"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WarpShaderHero() {
  const [mounted, setMounted] = useState(false);
  const [Warp, setWarp] = useState<any>(null);

  useEffect(() => {
    // Only load the shader component on the client side after mount
    setMounted(true);
    
    // Dynamically import the Warp component to avoid SSR issues
    import("@paper-design/shaders-react")
      .then((module) => {
        setWarp(() => module.Warp);
      })
      .catch((error) => {
        console.error("Failed to load shader component:", error);
        // Component will fallback to gradient background
      });
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        {mounted && Warp ? (
          <Warp
            style={{ height: "100%", width: "100%" }}
            proportion={0.45}
            softness={1}
            distortion={0.25}
            swirl={0.8}
            swirlIterations={10}
            shape="checks"
            shapeScale={0.1}
            scale={1}
            rotation={0}
            speed={1}
            colors={[
              "hsl(330, 85%, 60%)",
              "hsl(330, 85%, 80%)",
              "hsl(330, 75%, 90%)",
              "hsl(330, 85%, 70%)",
            ]}
          />
        ) : (
          // Fallback gradient background while shader loads or if it fails
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary-light"></div>
        )}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-8 py-24 md:py-32">
        <div className="max-w-4xl w-full text-center space-y-8">
          <h1 className="text-white text-5xl md:text-7xl font-bold text-balance tracking-tight">
            Welcome to{" "}
            <span className="bg-white/20 px-4 py-2 rounded-2xl">
              OpSale
            </span>
          </h1>

          <p className="text-white/90 text-xl md:text-2xl font-sans font-light leading-relaxed max-w-2xl mx-auto">
            Discover the latest fashion trends. Style that speaks to you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              href="/products"
              className="px-8 py-4 bg-white text-primary rounded-none font-semibold hover:bg-gray-50 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Shop Now
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-none font-semibold hover:bg-white/20 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
