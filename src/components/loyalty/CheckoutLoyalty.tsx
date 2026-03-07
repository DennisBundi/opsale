"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Tag, Gift } from "lucide-react";
import { useLoyaltyStore } from "@/store/loyaltyStore";

interface CheckoutLoyaltyProps {
  orderTotal: number;
  onRewardCodeApplied: (code: string, discountAmount: number) => void;
}

export default function CheckoutLoyalty({
  orderTotal,
  onRewardCodeApplied,
}: CheckoutLoyaltyProps) {
  const { account, rewardCodes, fetchAccount, fetchRewardCodes } =
    useLoyaltyStore();
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [selectedCode, setSelectedCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pointsToEarn = Math.floor(orderTotal / 10);

  useEffect(() => {
    async function init() {
      await Promise.all([fetchAccount(), fetchRewardCodes()]);
      setLoading(false);
    }
    init();
  }, [fetchAccount, fetchRewardCodes]);

  const activeRewardCodes = rewardCodes.filter(
    (rc) => !rc.is_used && new Date(rc.expires_at) > new Date()
  );

  const handleApplyCode = async (code: string) => {
    if (!code.trim()) return;
    setApplying(true);
    setError(null);

    try {
      const res = await fetch("/api/loyalty/reward-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid reward code");
      }

      const { data } = await res.json();
      setAppliedCode(code.trim());
      setManualCode("");
      // Calculate effective discount: fixed amount or percentage of order total
      const effectiveDiscount = data.discount_amount > 0
        ? data.discount_amount
        : data.discount_percent
          ? Math.round(orderTotal * data.discount_percent / 100)
          : 0;
      onRewardCodeApplied(code.trim(), effectiveDiscount);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setApplying(false);
    }
  };

  const handleDropdownSelect = (value: string) => {
    setSelectedCode(value);
    if (value) {
      const rc = activeRewardCodes.find((r) => r.code === value);
      if (rc) {
        handleApplyCode(rc.code);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading rewards...</span>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-pink-400" />
        <h3 className="font-semibold text-gray-800">Leez Rewards</h3>
      </div>

      {/* Points Balance */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Your Points Balance</span>
        <span className="font-semibold text-pink-500">
          {account.current_points.toLocaleString()} pts
        </span>
      </div>

      {/* Points to Earn */}
      <div className="bg-pink-50 rounded-lg p-3 text-sm">
        <span className="text-pink-600">
          You&apos;ll earn{" "}
          <span className="font-bold">+{pointsToEarn} pts</span> from this
          order
        </span>
      </div>

      {/* Applied Code */}
      {appliedCode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm">
          <Tag className="w-4 h-4 text-green-600" />
          <span className="text-green-700 font-medium">
            Code <span className="font-bold">{appliedCode}</span> applied
          </span>
        </div>
      )}

      {!appliedCode && (
        <>
          {/* Dropdown for active reward codes */}
          {activeRewardCodes.length > 0 && (
            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Your Reward Codes
              </label>
              <select
                value={selectedCode}
                onChange={(e) => handleDropdownSelect(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <option value="">Select a reward code</option>
                {activeRewardCodes.map((rc) => (
                  <option key={rc.id} value={rc.code}>
                    {rc.code} -{" "}
                    {rc.discount_percent
                      ? `${rc.discount_percent}% off`
                      : `KSh ${rc.discount_amount} off`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manual Code Input */}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              Enter Reward Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 uppercase"
              />
              <button
                onClick={() => handleApplyCode(manualCode)}
                disabled={applying || !manualCode.trim()}
                className="bg-pink-400 hover:bg-pink-500 text-white font-semibold px-4 py-2 rounded-none hover:scale-105 transition-all disabled:opacity-50 text-sm"
              >
                {applying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
