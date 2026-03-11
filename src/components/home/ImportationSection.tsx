"use client";

import { useState } from "react";
import WaitlistModal from "@/components/home/WaitlistModal";

export default function ImportationSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section
      className="relative text-white py-16 md:py-24 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
    >
      {/* Decorative blurred circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #4f46e5, transparent)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, #818cf8, transparent)" }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-4 py-2 rounded-full mb-6 text-sm font-semibold tracking-wide">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              EARLY ACCESS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Source Directly
              <br />
              <span className="text-indigo-400">from China</span>
            </h2>
            <p className="text-white/75 text-lg mb-8 max-w-lg leading-relaxed">
              Are you a Kenyan retailer? Get connected with verified Chinese
              suppliers. Join our waitlist and be among the first to access
              direct importation at competitive prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-indigo-500/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Join the Waitlist
              </button>
              <a
                href="/importation/status"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
              >
                Check my status
              </a>
            </div>
          </div>

          {/* Right: SVG trade route illustration */}
          <div className="flex items-center justify-center animate-fade-in">
            <TradeRouteIllustration />
          </div>
        </div>
      </div>

      {modalOpen && <WaitlistModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}

function TradeRouteIllustration() {
  return (
    <svg
      viewBox="0 0 400 260"
      className="w-full max-w-md"
      aria-label="Kenya to China trade route"
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="130" rx="180" ry="110" fill="url(#glow)" />

      {/* Dotted trade arc */}
      <path
        d="M 80 180 Q 200 30 320 180"
        fill="none"
        stroke="#818cf8"
        strokeWidth="2"
        strokeDasharray="8 6"
        opacity="0.7"
      />

      {/* Arrow at end of arc */}
      <polygon points="316,172 326,182 308,186" fill="#818cf8" opacity="0.7" />

      {/* Kenya node */}
      <circle cx="80" cy="180" r="28" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="2" />
      <text x="80" y="175" textAnchor="middle" fontSize="20">🇰🇪</text>
      <text x="80" y="220" textAnchor="middle" fontSize="11" fill="#93c5fd" fontWeight="600">
        KENYA
      </text>

      {/* China node */}
      <circle cx="320" cy="180" r="28" fill="#3b1f1f" stroke="#f87171" strokeWidth="2" />
      <text x="320" y="175" textAnchor="middle" fontSize="20">🇨🇳</text>
      <text x="320" y="220" textAnchor="middle" fontSize="11" fill="#fca5a5" fontWeight="600">
        CHINA
      </text>

      {/* Shipping box in the middle */}
      <g transform="translate(176, 72)">
        <rect x="0" y="8" width="48" height="38" rx="4" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" />
        <rect x="0" y="8" width="48" height="14" rx="4" fill="#3730a3" stroke="#818cf8" strokeWidth="1.5" />
        <line x1="24" y1="8" x2="24" y2="46" stroke="#818cf8" strokeWidth="1" opacity="0.5" />
        <text x="24" y="38" textAnchor="middle" fontSize="14">📦</text>
      </g>

      {/* Floating sparkles */}
      <circle cx="150" cy="90" r="2" fill="#a5b4fc" opacity="0.8" />
      <circle cx="260" cy="80" r="2" fill="#a5b4fc" opacity="0.6" />
      <circle cx="200" cy="55" r="1.5" fill="#c7d2fe" opacity="0.7" />
    </svg>
  );
}
