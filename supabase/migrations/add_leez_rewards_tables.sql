-- ============================================================
-- Leez Rewards: Loyalty Program Database Migration
-- ============================================================
-- New tables: loyalty_accounts, loyalty_transactions, referrals,
--             reviews, review_attempts, reward_codes
-- Modified tables: products (early_access_until), orders (reward fields)
-- ============================================================

-- ============================================================
-- 1. NEW TABLES
-- ============================================================

-- Loyalty account per user
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
    current_points INTEGER NOT NULL DEFAULT 0,
    total_points_earned INTEGER NOT NULL DEFAULT 0,
    birthday DATE,
    birthday_locked BOOLEAN NOT NULL DEFAULT false,
    referral_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Every points earn/spend event
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'referral', 'review', 'redemption', 'birthday', 'adjustment')),
    points INTEGER NOT NULL, -- positive = earned, negative = spent
    order_id UUID REFERENCES orders(id),
    review_id UUID,
    referral_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    points_awarded BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Product reviews with optional photos
-- All reviews require admin approval before going live
-- Only verified buyers (order completed + 1 day elapsed) can review
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL CHECK (char_length(text) >= 20),
    image_urls TEXT[] DEFAULT '{}',
    points_awarded INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT CHECK (rejection_reason IS NULL OR rejection_reason IN ('inappropriate_content', 'spam_low_effort', 'not_relevant')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track rejection count per user+product (persists even when review row is deleted)
-- Allows 1 resubmission after rejection; blocked after 2nd rejection
CREATE TABLE IF NOT EXISTS review_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rejection_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Generated discount codes from loyalty redemptions, birthdays, referrals
CREATE TABLE IF NOT EXISTS reward_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('points_redemption', 'birthday', 'referral_welcome')),
    discount_amount INTEGER NOT NULL DEFAULT 0, -- in KSh (for fixed discounts)
    discount_percent INTEGER, -- for percentage discounts (e.g. 5 for birthday)
    min_order_amount INTEGER DEFAULT 0,
    is_used BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. MODIFY EXISTING TABLES
-- ============================================================

-- Add early access column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS early_access_until TIMESTAMP WITH TIME ZONE;

-- Add loyalty/reward fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reward_code_id UUID REFERENCES reward_codes(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user_id ON loyalty_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created ON loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_attempts_user_product ON review_attempts(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_reward_codes_user_id ON reward_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_codes_code ON reward_codes(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_tx_purchase_order ON loyalty_transactions(user_id, order_id) WHERE type = 'purchase' AND order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_tx_referral ON loyalty_transactions(user_id, referral_id) WHERE type = 'referral' AND referral_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_tx_review ON loyalty_transactions(user_id, review_id) WHERE type = 'review' AND review_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_early_access ON products(early_access_until);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

-- loyalty_accounts: users can read own, service role can manage all
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own loyalty account" ON loyalty_accounts;
CREATE POLICY "Users can view own loyalty account" ON loyalty_accounts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages loyalty accounts" ON loyalty_accounts;
CREATE POLICY "Service role manages loyalty accounts" ON loyalty_accounts FOR ALL USING (auth.role() = 'service_role');

-- loyalty_transactions: users can read own
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON loyalty_transactions;
CREATE POLICY "Users can view own transactions" ON loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Service role manages loyalty transactions" ON loyalty_transactions FOR ALL USING (auth.role() = 'service_role');

-- referrals: users can read own (as referrer)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
DROP POLICY IF EXISTS "Service role manages referrals" ON referrals;
CREATE POLICY "Service role manages referrals" ON referrals FOR ALL USING (auth.role() = 'service_role');

-- reviews: anyone can read approved, users can read own, users can create own
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
CREATE POLICY "Anyone can view approved reviews" ON reviews FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;
CREATE POLICY "Users can view own reviews" ON reviews FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own reviews" ON reviews;
CREATE POLICY "Users can create own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages reviews" ON reviews;
CREATE POLICY "Service role manages reviews" ON reviews FOR ALL USING (auth.role() = 'service_role');

-- review_attempts: users can read own
ALTER TABLE review_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own review attempts" ON review_attempts;
CREATE POLICY "Users can view own review attempts" ON review_attempts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages review attempts" ON review_attempts;
CREATE POLICY "Service role manages review attempts" ON review_attempts FOR ALL USING (auth.role() = 'service_role');

-- reward_codes: users can read own
ALTER TABLE reward_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own reward codes" ON reward_codes;
CREATE POLICY "Users can view own reward codes" ON reward_codes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages reward codes" ON reward_codes;
CREATE POLICY "Service role manages reward codes" ON reward_codes FOR ALL USING (auth.role() = 'service_role');
