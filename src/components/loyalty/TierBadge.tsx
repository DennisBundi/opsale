"use client";

import React from "react";

type Tier = "bronze" | "silver" | "gold";
type Size = "sm" | "md" | "lg";

interface TierBadgeProps {
  tier: Tier;
  size?: Size;
  showLabel?: boolean;
}

const tierStyles: Record<Tier, string> = {
  bronze: "bg-gradient-to-br from-amber-700 to-amber-500 text-white",
  silver: "bg-gradient-to-br from-gray-400 to-gray-300 text-white",
  gold: "bg-gradient-to-br from-yellow-500 to-amber-400 text-white",
};

const sizeStyles: Record<Size, string> = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-12 h-12 text-lg",
};

const tierInitials: Record<Tier, string> = {
  bronze: "B",
  silver: "S",
  gold: "G",
};

export default function TierBadge({
  tier,
  size = "md",
  showLabel = false,
}: TierBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${tierStyles[tier]} ${sizeStyles[size]} rounded-full flex items-center justify-center font-semibold shadow-sm`}
      >
        {tierInitials[tier]}
      </div>
      {showLabel && (
        <span className="font-semibold text-gray-800 capitalize">{tier}</span>
      )}
    </div>
  );
}
