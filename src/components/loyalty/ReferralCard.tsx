"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Copy,
  Check,
  Share2,
  UserPlus,
  ShoppingBag,
  Gift,
} from "lucide-react";

interface Referral {
  id: string;
  referred_name: string;
  status: "pending" | "completed";
  created_at: string;
}

interface ReferralData {
  referral_code: string;
  referrals: Referral[];
}

export default function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch("/api/loyalty/referral");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const message = encodeURIComponent(
      `Join OpSale and get rewarded! Use my referral code: ${data.referral_code} to earn bonus points on your first order. Shop now at opsale.app`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-[#F4F8FF]/40">
        Unable to load referral data.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-primary/70 rounded-lg p-8 text-center text-white shadow-lg"
      >
        <Share2 className="w-10 h-10 mx-auto mb-3 opacity-80" />
        <h2 className="text-2xl font-semibold mb-2">Refer a Friend</h2>
        <p className="text-white/80 mb-6 text-sm">
          Share your code and earn points when friends make their first purchase
        </p>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg py-4 px-6 mb-6">
          <p className="text-3xl font-bold tracking-widest text-secondary">
            {data.referral_code}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleCopy}
            className="bg-white text-primary font-semibold py-3 px-6 rounded-none hover:scale-105 transition-all flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Code
              </>
            )}
          </button>
          <button
            onClick={handleWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-none hover:scale-105 transition-all flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share on WhatsApp
          </button>
        </div>
      </motion.div>

      {/* How it Works */}
      <div className="glass rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#F4F8FF] mb-4">
          How it Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: <UserPlus className="w-8 h-8 text-secondary" />,
              step: "1",
              title: "Share Your Code",
              desc: "Send your unique referral code to friends and family",
            },
            {
              icon: <ShoppingBag className="w-8 h-8 text-secondary" />,
              step: "2",
              title: "They Shop",
              desc: "Your friend makes their first purchase using your code",
            },
            {
              icon: <Gift className="w-8 h-8 text-secondary" />,
              step: "3",
              title: "Both Earn Points",
              desc: "You both receive bonus loyalty points as a reward",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-3">{item.icon}</div>
              <h4 className="font-semibold text-[#F4F8FF] mb-1">{item.title}</h4>
              <p className="text-sm text-[#F4F8FF]/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral List */}
      {data.referrals.length > 0 && (
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#F4F8FF] mb-4">
            Your Referrals
          </h3>
          <ul className="space-y-3">
            {data.referrals.map((ref) => (
              <li
                key={ref.id}
                className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-[#F4F8FF]">
                    {ref.referred_name}
                  </p>
                  <p className="text-xs text-[#F4F8FF]/40">
                    {new Date(ref.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    ref.status === "completed"
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/20 text-secondary"
                  }`}
                >
                  {ref.status === "completed" ? "Completed" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
