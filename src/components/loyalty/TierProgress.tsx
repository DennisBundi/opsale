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

const tierBarGradient: Record<Tier, string> = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-gray-400 to-gray-300",
  gold: "from-yellow-500 to-amber-400",
};

export default function TierProgress({
  currentTier,
  nextTier,
  pointsToNext,
  progressPercent,
  totalEarned,
}: TierProgressProps) {
  const gradientClass = nextTier
    ? tierBarGradient[nextTier]
    : tierBarGradient[currentTier];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-2">
        <TierBadge tier={currentTier} size="md" showLabel />
        {nextTier ? (
          <TierBadge tier={nextTier} size="md" showLabel />
        ) : (
          <span className="text-sm font-semibold text-yellow-600">Max Tier</span>
        )}
      </div>

      <div className="relative w-full h-5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${gradientClass} rounded-full flex items-center justify-center`}
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
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-500">
            {Math.round(progressPercent)}%
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-2 text-center">
        {nextTier ? (
          <>
            <span className="font-semibold text-gray-700">{pointsToNext}</span>{" "}
            pts to{" "}
            <span className="font-semibold capitalize">{nextTier}</span>
          </>
        ) : (
          "Max tier reached!"
        )}
      </p>

      <p className="text-xs text-gray-400 text-center mt-1">
        Total earned: {totalEarned.toLocaleString()} pts
      </p>
    </div>
  );
}
