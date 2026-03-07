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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Perks</h3>
      <ul className="space-y-3">
        {perks.map((perk, idx) => (
          <li key={idx} className="flex items-center gap-3">
            {perk.unlocked ? (
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <div>
              <span
                className={
                  perk.unlocked ? "text-gray-800" : "text-gray-400"
                }
              >
                {perk.name}
              </span>
              {!perk.unlocked && (
                <span className="text-xs text-gray-400 ml-2">
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
