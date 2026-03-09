import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// Tier thresholds based on total_points_earned (lifetime)
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 2000,
  gold: 5000,
} as const;

// Points redemption options: points -> KSh discount
const REDEMPTION_OPTIONS: Record<number, number> = {
  500: 50,
  1000: 100,
  2000: 250,
};

// Points earning rates
const POINTS_PER_KSH_10 = 1;
const REFERRAL_POINTS = 200;
const REVIEW_TEXT_POINTS = 50;
const REVIEW_PHOTO_POINTS = 100;
const SIGNUP_POINTS = 10;

export type Tier = "bronze" | "silver" | "gold";
export type TransactionType =
  | "purchase"
  | "referral"
  | "review"
  | "redemption"
  | "birthday"
  | "adjustment"
  | "signup";

export interface LoyaltyAccount {
  id: string;
  user_id: string;
  tier: Tier;
  current_points: number;
  total_points_earned: number;
  birthday: string | null;
  birthday_locked: boolean;
  referral_code: string;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyAccountWithProgress extends LoyaltyAccount {
  next_tier: Tier | null;
  points_to_next_tier: number;
  tier_progress_percent: number;
  perks: { name: string; unlocked: boolean; tier: Tier }[];
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  points: number;
  order_id: string | null;
  review_id: string | null;
  referral_id: string | null;
  description: string;
  created_at: string;
}

const ALL_PERKS = [
  { name: "Earn points on every purchase", tier: "bronze" as Tier },
  { name: "Birthday 5% off", tier: "bronze" as Tier },
  { name: "Refer friends for 200 pts", tier: "bronze" as Tier },
  { name: "Early access to new drops", tier: "silver" as Tier },
  { name: "Free shipping over KSh 2,000", tier: "silver" as Tier },
  { name: "48hr flash sale early access", tier: "gold" as Tier },
  { name: "Free shipping on all orders", tier: "gold" as Tier },
  { name: "Exclusive Gold-only deals", tier: "gold" as Tier },
];

function getTierRank(tier: Tier): number {
  const ranks: Record<Tier, number> = { bronze: 0, silver: 1, gold: 2 };
  return ranks[tier];
}

export class LoyaltyService {
  /**
   * Generate a unique referral code from user info
   */
  static generateReferralCode(name: string | null, userId: string): string {
    const prefix = name
      ? name.replace(/[^a-zA-Z]/g, "").substring(0, 6).toUpperCase()
      : "LEEZ";
    const suffix = userId.substring(0, 4).toUpperCase();
    const random = randomBytes(3).toString("hex").substring(0, 4).toUpperCase();
    return `${prefix}${suffix}${random}`;
  }

  /**
   * Create a loyalty account for a new user
   */
  static async createAccount(
    userId: string,
    userName?: string | null
  ): Promise<LoyaltyAccount | null> {
    const admin = createAdminClient();

    // Check if account already exists
    const { data: existing } = await admin
      .from("loyalty_accounts")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing) return existing as LoyaltyAccount;

    // Generate unique referral code with retry
    let referralCode = this.generateReferralCode(userName || null, userId);
    let attempts = 0;
    while (attempts < 5) {
      const { data: codeExists } = await admin
        .from("loyalty_accounts")
        .select("id")
        .eq("referral_code", referralCode)
        .single();

      if (!codeExists) break;
      referralCode = this.generateReferralCode(userName || null, userId);
      attempts++;
    }

    const { data, error } = await admin
      .from("loyalty_accounts")
      .insert({
        user_id: userId,
        tier: "bronze",
        current_points: 0,
        total_points_earned: 0,
        referral_code: referralCode,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating loyalty account:", error);
      return null;
    }

    return data as LoyaltyAccount;
  }

  /**
   * Get a user's loyalty account with computed tier progress
   */
  static async getAccount(
    userId: string
  ): Promise<LoyaltyAccountWithProgress | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("loyalty_accounts")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;

    const account = data as LoyaltyAccount;
    return this.computeProgress(account);
  }

  /**
   * Compute tier progress and perks for an account
   */
  static computeProgress(account: LoyaltyAccount): LoyaltyAccountWithProgress {
    const tierRank = getTierRank(account.tier);
    const tiers: Tier[] = ["bronze", "silver", "gold"];
    const nextTier = tierRank < 2 ? tiers[tierRank + 1] : null;

    let pointsToNextTier = 0;
    let tierProgressPercent = 100;

    if (nextTier) {
      const currentThreshold = TIER_THRESHOLDS[account.tier];
      const nextThreshold = TIER_THRESHOLDS[nextTier];
      const range = nextThreshold - currentThreshold;
      const progress = account.total_points_earned - currentThreshold;
      pointsToNextTier = Math.max(0, nextThreshold - account.total_points_earned);
      tierProgressPercent = Math.min(100, Math.round((progress / range) * 100));
    }

    const perks = ALL_PERKS.map((perk) => ({
      ...perk,
      unlocked: getTierRank(account.tier) >= getTierRank(perk.tier),
    }));

    return {
      ...account,
      next_tier: nextTier,
      points_to_next_tier: pointsToNextTier,
      tier_progress_percent: tierProgressPercent,
      perks,
    };
  }

  /**
   * Award points for a purchase (1 point per KSh 10 spent)
   */
  static async awardPurchasePoints(
    userId: string,
    orderId: string,
    amount: number
  ): Promise<number> {
    const points = Math.floor(amount / 10) * POINTS_PER_KSH_10;
    if (points <= 0) return 0;

    const admin = createAdminClient();

    // Use upsert-style insert to prevent race conditions.
    // First check if already awarded, then insert with a unique description
    // to catch concurrent inserts via DB-level constraint.
    const { data: existing } = await admin
      .from("loyalty_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("order_id", orderId)
      .eq("type", "purchase")
      .maybeSingle();

    if (existing) return 0; // Already awarded

    // Create transaction — if a concurrent request already inserted,
    // the insert will fail and we return 0 gracefully.
    const { error: txError } = await admin.from("loyalty_transactions").insert({
      user_id: userId,
      type: "purchase",
      points,
      order_id: orderId,
      description: `Earned ${points} pts from order`,
    });

    if (txError) {
      logger.error("Error awarding purchase points:", txError);
      return 0;
    }

    // Update account
    await this.addPoints(userId, points);

    // Update order with points earned
    await admin
      .from("orders")
      .update({ points_earned: points })
      .eq("id", orderId);

    return points;
  }

  /**
   * Award referral points (200 pts to referrer)
   */
  static async awardReferralPoints(
    referrerId: string,
    referralId: string
  ): Promise<number> {
    const admin = createAdminClient();

    // Check if already awarded for this referral
    const { data: existing } = await admin
      .from("loyalty_transactions")
      .select("id")
      .eq("user_id", referrerId)
      .eq("referral_id", referralId)
      .eq("type", "referral")
      .maybeSingle();

    if (existing) return 0;

    const { error: txError } = await admin.from("loyalty_transactions").insert({
      user_id: referrerId,
      type: "referral",
      points: REFERRAL_POINTS,
      referral_id: referralId,
      description: `Earned ${REFERRAL_POINTS} pts from referral`,
    });

    if (txError) {
      logger.error("Error awarding referral points:", txError);
      return 0;
    }

    await this.addPoints(referrerId, REFERRAL_POINTS);

    // Mark referral as points awarded
    await admin
      .from("referrals")
      .update({ points_awarded: true })
      .eq("id", referralId);

    return REFERRAL_POINTS;
  }

  /**
   * Award review points (50 for text, 100 for text + photo)
   */
  static async awardReviewPoints(
    userId: string,
    reviewId: string,
    hasPhoto: boolean
  ): Promise<number> {
    const points = hasPhoto ? REVIEW_PHOTO_POINTS : REVIEW_TEXT_POINTS;
    const admin = createAdminClient();

    // Check if already awarded
    const { data: existing } = await admin
      .from("loyalty_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("review_id", reviewId)
      .eq("type", "review")
      .maybeSingle();

    if (existing) return 0;

    const { error: txError } = await admin.from("loyalty_transactions").insert({
      user_id: userId,
      type: "review",
      points,
      review_id: reviewId,
      description: `Earned ${points} pts from ${hasPhoto ? "photo " : ""}review`,
    });

    if (txError) {
      logger.error("Error awarding review points:", txError);
      return 0;
    }

    // Update review with points awarded
    await admin
      .from("reviews")
      .update({ points_awarded: points })
      .eq("id", reviewId);

    await this.addPoints(userId, points);
    return points;
  }

  /**
   * Award signup bonus points to a new user
   */
  static async awardSignupPoints(userId: string): Promise<number> {
    const admin = createAdminClient();

    // Check if already awarded
    const { data: existing } = await admin
      .from("loyalty_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "signup")
      .maybeSingle();

    if (existing) return 0;

    const { error: txError } = await admin.from("loyalty_transactions").insert({
      user_id: userId,
      type: "signup",
      points: SIGNUP_POINTS,
      description: `Welcome bonus: earned ${SIGNUP_POINTS} pts for signing up`,
    });

    if (txError) {
      logger.error("Error awarding signup points:", txError);
      return 0;
    }

    await this.addPoints(userId, SIGNUP_POINTS);
    return SIGNUP_POINTS;
  }

  /**
   * Redeem points for a discount code
   */
  static async redeemPoints(
    userId: string,
    points: number
  ): Promise<{ code: string; discount_amount: number; expires_at: string } | null> {
    const discountAmount = REDEMPTION_OPTIONS[points];
    if (!discountAmount) return null;

    const admin = createAdminClient();

    // Get current account
    const { data: account } = await admin
      .from("loyalty_accounts")
      .select("current_points")
      .eq("user_id", userId)
      .single();

    if (!account || account.current_points < points) return null;

    // Generate unique code
    const code = `LEEZ-${randomBytes(4).toString("hex").substring(0, 6).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiry

    // Create reward code
    const { error: codeError } = await admin.from("reward_codes").insert({
      user_id: userId,
      code,
      type: "points_redemption",
      discount_amount: discountAmount,
      expires_at: expiresAt.toISOString(),
    });

    if (codeError) {
      logger.error("Error creating reward code:", codeError);
      return null;
    }

    // Create transaction (negative points)
    await admin.from("loyalty_transactions").insert({
      user_id: userId,
      type: "redemption",
      points: -points,
      description: `Redeemed ${points} pts for KSh ${discountAmount} off`,
    });

    // Deduct points
    await admin
      .from("loyalty_accounts")
      .update({
        current_points: account.current_points - points,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return {
      code,
      discount_amount: discountAmount,
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Recalculate and update tier based on total_points_earned
   */
  static async recalculateTier(userId: string): Promise<Tier> {
    const admin = createAdminClient();

    const { data: account } = await admin
      .from("loyalty_accounts")
      .select("total_points_earned, tier")
      .eq("user_id", userId)
      .single();

    if (!account) return "bronze";

    let newTier: Tier = "bronze";
    if (account.total_points_earned >= TIER_THRESHOLDS.gold) {
      newTier = "gold";
    } else if (account.total_points_earned >= TIER_THRESHOLDS.silver) {
      newTier = "silver";
    }

    if (newTier !== account.tier) {
      await admin
        .from("loyalty_accounts")
        .update({ tier: newTier, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    return newTier;
  }

  /**
   * Get paginated transaction history
   */
  static async getTransactionHistory(
    userId: string,
    options: {
      type?: TransactionType;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ transactions: LoyaltyTransaction[]; total: number }> {
    const supabase = await createClient();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("loyalty_transactions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (options.type) {
      query = query.eq("type", options.type);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error("Error fetching transaction history:", error);
      return { transactions: [], total: 0 };
    }

    return {
      transactions: (data || []) as LoyaltyTransaction[],
      total: count || 0,
    };
  }

  /**
   * Add points to account and recalculate tier
   */
  private static async addPoints(
    userId: string,
    points: number
  ): Promise<void> {
    const admin = createAdminClient();

    const { data: account } = await admin
      .from("loyalty_accounts")
      .select("current_points, total_points_earned")
      .eq("user_id", userId)
      .single();

    if (!account) return;

    await admin
      .from("loyalty_accounts")
      .update({
        current_points: account.current_points + points,
        total_points_earned: account.total_points_earned + points,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Recalculate tier after points change
    await this.recalculateTier(userId);
  }

  /**
   * Get valid redemption options for current points balance
   */
  static getRedemptionOptions(currentPoints: number) {
    return Object.entries(REDEMPTION_OPTIONS).map(([pts, discount]) => ({
      points: Number(pts),
      discount_amount: discount,
      available: currentPoints >= Number(pts),
      points_needed: Math.max(0, Number(pts) - currentPoints),
    }));
  }

  /**
   * Generate birthday reward code (5% off, valid for birthday month)
   */
  static async generateBirthdayReward(userId: string): Promise<string | null> {
    const admin = createAdminClient();

    const { data: account } = await admin
      .from("loyalty_accounts")
      .select("birthday")
      .eq("user_id", userId)
      .single();

    if (!account?.birthday) return null;

    // Check if birthday reward already generated this year
    const year = new Date().getFullYear();
    const birthdayMonth = new Date(account.birthday).getMonth();
    const startOfMonth = new Date(year, birthdayMonth, 1);
    const endOfMonth = new Date(year, birthdayMonth + 1, 0, 23, 59, 59);

    const { data: existingCode } = await admin
      .from("reward_codes")
      .select("code")
      .eq("user_id", userId)
      .eq("type", "birthday")
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString())
      .single();

    if (existingCode) return existingCode.code;

    const code = `BDAY-${randomBytes(4).toString("hex").substring(0, 6).toUpperCase()}`;

    const { error } = await admin.from("reward_codes").insert({
      user_id: userId,
      code,
      type: "birthday",
      discount_amount: 0,
      discount_percent: 5,
      expires_at: endOfMonth.toISOString(),
    });

    if (error) {
      logger.error("Error generating birthday reward:", error);
      return null;
    }

    // Log transaction
    await admin.from("loyalty_transactions").insert({
      user_id: userId,
      type: "birthday",
      points: 0,
      description: "Birthday reward: 5% off code generated",
    });

    return code;
  }
}
