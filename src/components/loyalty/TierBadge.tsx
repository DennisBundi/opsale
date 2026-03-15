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
  bronze: "text-white",
  silver: "text-white",
  gold: "text-white",
};

const tierInlineStyles: Record<Tier, React.CSSProperties> = {
  bronze: { background: "#00C896" },
  silver: { background: "#C0C0C0" },
  gold: { background: "#F5A623" },
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
        style={tierInlineStyles[tier]}
      >
        {tierInitials[tier]}
      </div>
      {showLabel && (
        <span className="font-semibold text-[#F4F8FF] capitalize">{tier}</span>
      )}
    </div>
  );
}
