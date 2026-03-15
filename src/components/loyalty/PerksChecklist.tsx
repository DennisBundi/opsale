"use client";

import React from "react";
import { Check, Lock } from "lucide-react";

interface Perk {
  name: string;
  unlocked: boolean;
  tier: string;
}

interface PerksChecklistProps {
  perks: Perk[];
}

export default function PerksChecklist({ perks }: PerksChecklistProps) {
  return (
    <div className="glass rounded-lg p-6">
      <h3 className="text-lg font-semibold text-[#F4F8FF] mb-4">Your Perks</h3>
      <ul className="space-y-3">
        {perks.map((perk, idx) => (
          <li key={idx} className="flex items-center gap-3">
            {perk.unlocked ? (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-primary" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-[#F4F8FF]/30" />
              </div>
            )}
            <div>
              <span
                className={
                  perk.unlocked ? "text-[#F4F8FF]" : "text-[#F4F8FF]/40"
                }
              >
                {perk.name}
              </span>
              {!perk.unlocked && (
                <span className="text-xs text-[#F4F8FF]/30 ml-2">
                  (Unlock at {perk.tier})
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
