"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Gift, Users, History, Cake } from "lucide-react";
import { useLoyaltyStore } from "@/store/loyaltyStore";
import TierBadge from "./TierBadge";
import TierProgress from "./TierProgress";
import PerksChecklist from "./PerksChecklist";
import RedeemModal from "./RedeemModal";

export default function LoyaltyDashboard() {
  const { account, loading, error, fetchAccount } = useLoyaltyStore();
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState("");
  const [birthdaySaving, setBirthdaySaving] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAccount();
    }
  }, [fetchAccount]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/loyalty/account", { method: "POST" });
      if (res.ok) {
        await fetchAccount();
      }
    } catch {
      // handle error silently
    } finally {
      setJoining(false);
    }
  };

  const handleSetBirthday = async () => {
    if (!birthdayInput) return;
    setBirthdaySaving(true);
    try {
      const res = await fetch("/api/loyalty/account/birthday", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthday: birthdayInput }),
      });
      if (res.ok) {
        await fetchAccount();
        setBirthdayInput("");
      }
    } catch {
      // handle error silently
    } finally {
      setBirthdaySaving(false);
    }
  };

  if (loading && !account) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !account) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg p-8"
        >
          <Gift className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-[#F4F8FF] mb-2">
            Join OpSale Rewards
          </h2>
          <p className="text-[#F4F8FF]/60 mb-6">
            Earn points on every purchase, unlock exclusive perks, and get
            rewarded for being a loyal customer.
          </p>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-none hover:scale-105 transition-all disabled:opacity-50"
          >
            {joining ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Create My Rewards Account"
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  const totalRedeemed = account.total_points_earned - account.current_points;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <TierBadge tier={account.tier} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold text-[#F4F8FF]">
            Welcome back!
          </h1>
          <p className="text-[#F4F8FF]/60 capitalize">{account.tier} Member</p>
        </div>
      </motion.div>

      {/* Tier Progress */}
      <TierProgress
        currentTier={account.tier}
        nextTier={account.next_tier}
        pointsToNext={account.points_to_next_tier}
        progressPercent={account.tier_progress_percent}
        totalEarned={account.total_points_earned}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Current Points",
            value: account.current_points.toLocaleString(),
            color: "text-secondary",
          },
          {
            label: "Total Earned",
            value: account.total_points_earned.toLocaleString(),
            color: "text-primary",
          },
          {
            label: "Total Redeemed",
            value: totalRedeemed.toLocaleString(),
            color: "text-[#F4F8FF]/80",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-lg p-4 text-center"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-[#F4F8FF]/50 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Perks Checklist */}
      <PerksChecklist perks={account.perks} />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setRedeemOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-none hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <Gift className="w-5 h-5" />
          Redeem Points
        </button>
        <Link
          href="/profile/rewards/refer"
          className="glass border border-secondary/40 text-secondary font-semibold py-3 px-6 rounded-none hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <Users className="w-5 h-5" />
          Refer a Friend
        </Link>
      </div>

      {/* Points History Link */}
      <Link
        href="/profile/rewards/history"
        className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-semibold py-2 transition-colors"
      >
        <History className="w-5 h-5" />
        View Points History
      </Link>

      {/* Birthday Section */}
      <div className="glass rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <Cake className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold text-[#F4F8FF]">Birthday</h3>
        </div>
        {account.birthday ? (
          <p className="text-[#F4F8FF]/70">
            Birthday:{" "}
            <span className="font-semibold text-[#F4F8FF]">
              {new Date(account.birthday).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        ) : (
          <div className="flex gap-3">
            <input
              type="date"
              value={birthdayInput}
              onChange={(e) => setBirthdayInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F4F8FF] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleSetBirthday}
              disabled={birthdaySaving || !birthdayInput}
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-none hover:scale-105 transition-all disabled:opacity-50 text-sm"
            >
              {birthdaySaving ? "Saving..." : "Set Birthday"}
            </button>
          </div>
        )}
      </div>

      {/* Redeem Modal */}
      <RedeemModal isOpen={redeemOpen} onClose={() => setRedeemOpen(false)} />
    </div>
  );
}
