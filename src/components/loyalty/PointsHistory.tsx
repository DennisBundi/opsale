"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  ShoppingBag,
  Users,
  Star,
  Gift,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { useLoyaltyStore } from "@/store/loyaltyStore";

const TABS = [
  { label: "All", value: "" },
  { label: "Purchases", value: "purchase" },
  { label: "Referrals", value: "referral" },
  { label: "Reviews", value: "review" },
  { label: "Redeemed", value: "redemption" },
] as const;

const PAGE_SIZE = 20;

function getIcon(type: string) {
  switch (type) {
    case "purchase":
      return <ShoppingBag className="w-4 h-4" />;
    case "referral":
      return <Users className="w-4 h-4" />;
    case "review":
      return <Star className="w-4 h-4" />;
    case "redemption":
      return <Gift className="w-4 h-4" />;
    default:
      return <Gift className="w-4 h-4" />;
  }
}

function groupByMonth(
  transactions: { id: string; type: string; points: number; description: string; created_at: string }[]
) {
  const groups: Record<string, typeof transactions> = {};
  for (const tx of transactions) {
    const date = new Date(tx.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function PointsHistory() {
  const { transactions, loading, fetchTransactions } = useLoyaltyStore();
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchTransactions(activeTab || undefined, page);
  }, [activeTab, page, fetchTransactions]);

  const grouped = useMemo(() => groupByMonth(transactions), [transactions]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-[#F4F8FF] mb-6">
        Points History
      </h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 text-sm font-semibold rounded-none whitespace-nowrap transition-all hover:scale-105 ${
              activeTab === tab.value
                ? "bg-primary text-white"
                : "glass text-[#F4F8FF]/70 border border-white/10 hover:border-primary/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-[#F4F8FF]/40">
          No transactions found.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([monthKey, txs]) => (
            <div key={monthKey}>
              <h3 className="text-sm font-semibold text-[#F4F8FF]/50 uppercase tracking-wider mb-3">
                {formatMonthLabel(monthKey)}
              </h3>
              <div className="space-y-2">
                {txs.map((tx, idx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="glass rounded-lg p-4 flex items-center gap-4"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.points >= 0
                          ? "bg-primary/20 text-primary"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {getIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F4F8FF] truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-[#F4F8FF]/40">
                        {new Date(tx.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {tx.points >= 0 ? (
                        <ArrowUp className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-red-400" />
                      )}
                      <span
                        className={`text-sm font-bold ${
                          tx.points >= 0 ? "text-secondary" : "text-red-400"
                        }`}
                      >
                        {tx.points >= 0 ? "+" : ""}
                        {tx.points}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {transactions.length > 0 && (
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 glass border border-white/10 text-[#F4F8FF]/70 font-semibold rounded-none hover:scale-105 transition-all disabled:opacity-50"
          >
            Previous
          </button>
          <span className="flex items-center text-sm text-[#F4F8FF]/50">
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={transactions.length < PAGE_SIZE}
            className="px-4 py-2 glass border border-white/10 text-[#F4F8FF]/70 font-semibold rounded-none hover:scale-105 transition-all disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
