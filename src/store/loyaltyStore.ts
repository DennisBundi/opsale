import { create } from "zustand";

interface LoyaltyAccount {
  id: string;
  tier: "bronze" | "silver" | "gold";
  current_points: number;
  total_points_earned: number;
  birthday: string | null;
  birthday_locked: boolean;
  referral_code: string;
  next_tier: "silver" | "gold" | null;
  points_to_next_tier: number;
  tier_progress_percent: number;
  perks: { name: string; unlocked: boolean; tier: string }[];
}

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  order_id: string | null;
  description: string;
  created_at: string;
}

interface RewardCode {
  id: string;
  code: string;
  type: string;
  discount_amount: number;
  discount_percent: number | null;
  is_used: boolean;
  expires_at: string;
}

interface LoyaltyStore {
  account: LoyaltyAccount | null;
  transactions: LoyaltyTransaction[];
  rewardCodes: RewardCode[];
  loading: boolean;
  error: string | null;
  fetchAccount: () => Promise<void>;
  fetchTransactions: (type?: string, page?: number) => Promise<void>;
  fetchRewardCodes: () => Promise<void>;
  redeemPoints: (points: number) => Promise<{ code: string; discount_amount: number } | null>;
  clearLoyalty: () => void;
}

export const useLoyaltyStore = create<LoyaltyStore>()((set, get) => ({
  account: null,
  transactions: [],
  rewardCodes: [],
  loading: false,
  error: null,

  fetchAccount: async () => {
    if (get().loading) return; // Prevent overlapping calls
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/loyalty/account");
      if (!res.ok) {
        if (res.status === 404 || res.status === 401) {
          set({ account: null, loading: false });
          return;
        }
        throw new Error("Failed to fetch loyalty account");
      }
      const json = await res.json();
      const accountData = json.data || json.account || null;
      set({ account: accountData, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchTransactions: async (type?: string, page = 1) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (type) params.set("type", type);
      const res = await fetch(`/api/loyalty/transactions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const json = await res.json();
      set({ transactions: json.transactions || [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchRewardCodes: async () => {
    try {
      const res = await fetch("/api/loyalty/reward-codes");
      if (!res.ok) return;
      const json = await res.json();
      set({ rewardCodes: json.reward_codes || [] });
    } catch {
      // Silent fail for reward codes
    }
  },

  redeemPoints: async (points: number) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to redeem points");
      }

      // Refresh account to get updated points
      await get().fetchAccount();
      await get().fetchRewardCodes();

      set({ loading: false });
      return { code: json.code, discount_amount: json.discount_amount };
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      return null;
    }
  },

  clearLoyalty: () => {
    set({ account: null, transactions: [], rewardCodes: [], error: null });
  },
}));
