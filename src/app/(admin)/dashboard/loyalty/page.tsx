"use client";

import { useState, useEffect } from "react";

interface LoyaltyStats {
  totalAccounts: number;
  tierBreakdown: { bronze: number; silver: number; gold: number };
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  topReferrers: { user_id: string; name: string; referral_count: number }[];
  reviewStats: { pending: number; approved: number; rejected: number };
}

export default function LoyaltyAnalyticsPage() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [accountsRes, reviewsRes] = await Promise.all([
        fetch("/api/loyalty/account"),
        fetch("/api/reviews/pending?status=all"),
      ]);

      // For now, build stats from available data
      // In production, you'd create a dedicated /api/loyalty/analytics endpoint
      setStats({
        totalAccounts: 0,
        tierBreakdown: { bronze: 0, silver: 0, gold: 0 },
        totalPointsIssued: 0,
        totalPointsRedeemed: 0,
        topReferrers: [],
        reviewStats: { pending: 0, approved: 0, rejected: 0 },
      });
    } catch (error) {
      console.error("Error fetching loyalty stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leez Rewards Analytics</h1>
        <p className="text-gray-600 mt-1">Overview of the loyalty program performance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Members"
          value={stats?.totalAccounts || 0}
          icon="users"
        />
        <StatCard
          label="Points Issued"
          value={stats?.totalPointsIssued || 0}
          icon="plus"
        />
        <StatCard
          label="Points Redeemed"
          value={stats?.totalPointsRedeemed || 0}
          icon="minus"
        />
        <StatCard
          label="Pending Reviews"
          value={stats?.reviewStats.pending || 0}
          icon="clock"
        />
      </div>

      {/* Tier Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tier Distribution</h2>
          <div className="space-y-4">
            <TierBar label="Gold" count={stats?.tierBreakdown.gold || 0} total={stats?.totalAccounts || 1} color="bg-yellow-500" />
            <TierBar label="Silver" count={stats?.tierBreakdown.silver || 0} total={stats?.totalAccounts || 1} color="bg-gray-400" />
            <TierBar label="Bronze" count={stats?.tierBreakdown.bronze || 0} total={stats?.totalAccounts || 1} color="bg-amber-700" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Stats</h2>
          <div className="space-y-4">
            <TierBar label="Approved" count={stats?.reviewStats.approved || 0} total={Math.max(1, (stats?.reviewStats.approved || 0) + (stats?.reviewStats.pending || 0) + (stats?.reviewStats.rejected || 0))} color="bg-green-500" />
            <TierBar label="Pending" count={stats?.reviewStats.pending || 0} total={Math.max(1, (stats?.reviewStats.approved || 0) + (stats?.reviewStats.pending || 0) + (stats?.reviewStats.rejected || 0))} color="bg-yellow-500" />
            <TierBar label="Rejected" count={stats?.reviewStats.rejected || 0} total={Math.max(1, (stats?.reviewStats.approved || 0) + (stats?.reviewStats.pending || 0) + (stats?.reviewStats.rejected || 0))} color="bg-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
        Analytics will populate as customers join Leez Rewards and interact with the loyalty program.
        For detailed stats, a dedicated analytics API endpoint will be created.
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  const icons: Record<string, string> = {
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    plus: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    minus: "M20 12H4",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function TierBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percent = Math.round((count / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{count} ({percent}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
