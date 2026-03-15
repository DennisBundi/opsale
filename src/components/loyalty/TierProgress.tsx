"use client";

import React from "react";
import { motion } from "framer-motion";
import TierBadge from "./TierBadge";

type Tier = "bronze" | "silver" | "gold";

interface TierProgressProps {
  currentTier: Tier;
  nextTier: Tier | null;
  pointsToNext: number;
  progressPercent: number;
  totalEarned: number;
}

export default function TierProgress({
  currentTier,
  nextTier,
  pointsToNext,
  progressPercent,
  totalEarned,
}: TierProgressProps) {
  return (
    <div className="glass rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <TierBadge tier={currentTier} size="md" showLabel />
        {nextTier ? (
          <TierBadge tier={nextTier} size="md" showLabel />
        ) : (
          <span className="text-sm font-semibold text-secondary">Max Tier</span>
        )}
      </div>

      <div className="relative w-full h-5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full flex items-center justify-center"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progressPercent, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {progressPercent >= 15 && (
            <span className="text-[10px] font-bold text-white drop-shadow">
              {Math.round(progressPercent)}%
            </span>
          )}
        </motion.div>
        {progressPercent < 15 && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#F4F8FF]/60">
            {Math.round(progressPercent)}%
          </span>
        )}
      </div>

      <p className="text-sm text-[#F4F8FF]/60 mt-2 text-center">
        {nextTier ? (
          <>
            <span className="font-semibold text-[#F4F8FF]">{pointsToNext}</span>{" "}
            pts to{" "}
            <span className="font-semibold capitalize">{nextTier}</span>
          </>
        ) : (
          "Max tier reached!"
        )}
      </p>

      <p className="text-xs text-[#F4F8FF]/40 text-center mt-1">
        Total earned: {totalEarned.toLocaleString()} pts
      </p>
    </div>
  );
}
