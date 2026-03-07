# Technical Architecture: Leez Rewards

## Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend | Next.js (App Router) | 14.2+ | Existing framework; server components for data fetching, client components for interactivity |
| Styling | Tailwind CSS | 3.4+ | Existing design system; pink/hot-pink brand colors |
| State | Zustand | 4.5+ | Existing pattern; add loyaltyStore alongside cartStore and authStore |
| Database | Supabase (PostgreSQL) | Latest | Existing infrastructure; new tables with RLS policies |
| Auth | Supabase Auth | Latest | Existing auth system; loyalty auto-linked to user_id |
| Validation | Zod | 3.22+ | Existing validation pattern in API routes |
| Animations | Framer Motion | 12+ | Existing dependency; tier upgrade celebrations, progress animations |
| Image Upload | Supabase Storage | Latest | Existing upload infrastructure for review photos |

## System Architecture

```
User Browser
    |
    v
[Next.js App Router]
    |
    ├── Server Components (loyalty dashboard, review display)
    │       └── Direct Supabase queries via createClient()
    |
    ├── Client Components (navbar badge, checkout integration, review form)
    │       └── Zustand loyaltyStore → API routes
    |
    └── API Routes (/api/loyalty/*, /api/reviews/*)
            ├── createClient() for user-scoped operations
            ├── createAdminClient() for privileged operations (points adjustment, tier calc)
            └── Zod validation on all inputs

Supabase PostgreSQL
    ├── loyalty_accounts (tier, points)
    ├── loyalty_transactions (points log)
    ├── referrals (tracking)
    ├── reviews (UGC + moderation)
    └── reward_codes (generated discounts)

Triggers / Functions (Supabase)
    ├── on order completed → award purchase points
    ├── on loyalty_transactions insert → recalculate tier
    └── on birthday month → generate birthday reward
```

## Database Schema

### New Tables

```sql
-- Loyalty account per user
CREATE TABLE loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
    current_points INTEGER NOT NULL DEFAULT 0,
    total_points_earned INTEGER NOT NULL DEFAULT 0,
    birthday DATE,
    birthday_locked BOOLEAN NOT NULL DEFAULT false,
    referral_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Every points earn/spend event
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'referral', 'review', 'redemption', 'birthday', 'adjustment')),
    points INTEGER NOT NULL, -- positive = earned, negative = spent
    order_id UUID REFERENCES orders(id),
    review_id UUID,
    referral_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referral tracking
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    points_awarded BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Product reviews with optional photos
-- Moderation: All reviews require admin approval before going live
-- Rejection: Customer can retry once after rejection; blocked after 2nd rejection
-- Eligibility: Only verified buyers (order completed + 1 day elapsed) can review
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL CHECK (char_length(text) >= 20),
    image_urls TEXT[] DEFAULT '{}',
    points_awarded INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT CHECK (rejection_reason IN ('inappropriate_content', 'spam_low_effort', 'not_relevant')),
    rejection_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- No UNIQUE(user_id, product_id) on reviews — we delete rejected reviews to allow resubmission

-- Track rejection count per user+product (persists even when review row is deleted)
CREATE TABLE review_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rejection_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Generated discount codes from loyalty
CREATE TABLE reward_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('points_redemption', 'birthday', 'referral_welcome')),
    discount_amount INTEGER NOT NULL, -- in KSh
    discount_percent INTEGER, -- for birthday rewards (5%)
    min_order_amount INTEGER DEFAULT 0,
    is_used BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Modified Tables

```sql
-- Add to products table
ALTER TABLE products ADD COLUMN early_access_until TIMESTAMPTZ;

-- Add to orders table (for reward code tracking)
ALTER TABLE orders ADD COLUMN reward_code_id UUID REFERENCES reward_codes(id);
ALTER TABLE orders ADD COLUMN points_earned INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN referral_code TEXT; -- track which referral code was used at signup
```

### Indexes

```sql
CREATE INDEX idx_loyalty_accounts_user_id ON loyalty_accounts(user_id);
CREATE INDEX idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_review_attempts_user_product ON review_attempts(user_id, product_id);
CREATE INDEX idx_reward_codes_user_id ON reward_codes(user_id);
CREATE INDEX idx_reward_codes_code ON reward_codes(code);
CREATE INDEX idx_products_early_access ON products(early_access_until);
```

### Row Level Security (RLS)

```sql
-- loyalty_accounts: users can read own, admins can read all
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own loyalty account" ON loyalty_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all" ON loyalty_accounts FOR ALL USING (auth.role() = 'service_role');

-- loyalty_transactions: users can read own
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all" ON loyalty_transactions FOR ALL USING (auth.role() = 'service_role');

-- referrals: users can read own (as referrer)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Service role can manage all" ON referrals FOR ALL USING (auth.role() = 'service_role');

-- reviews: anyone can read approved, users can create own, only service role can update/delete
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved reviews" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view own reviews" ON reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage all" ON reviews FOR ALL USING (auth.role() = 'service_role');

-- review_attempts: users can read own, only service role can manage
ALTER TABLE review_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own attempts" ON review_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all" ON review_attempts FOR ALL USING (auth.role() = 'service_role');

-- reward_codes: users can read own
ALTER TABLE reward_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reward codes" ON reward_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all" ON reward_codes FOR ALL USING (auth.role() = 'service_role');
```

## API Design

### Loyalty Endpoints

```
GET  /api/loyalty/account          → Get current user's loyalty account
POST /api/loyalty/account          → Create loyalty account (auto on first purchase or signup)
PUT  /api/loyalty/account/birthday → Set birthday (one-time, locks after)

GET  /api/loyalty/transactions     → Get points history (paginated, filterable by type)
POST /api/loyalty/points/award     → Award points (admin only, for adjustments)

POST /api/loyalty/redeem           → Redeem points for discount code
GET  /api/loyalty/reward-codes     → Get user's active reward codes

GET  /api/loyalty/referral         → Get user's referral code + referral list
POST /api/loyalty/referral/apply   → Apply referral code during signup
```

### Review Endpoints

```
GET  /api/reviews/product/[id]     → Get approved reviews for a product (public)
GET  /api/reviews/product/[id]/summary → Get rating summary (avg, count, breakdown) (public)
POST /api/reviews                  → Submit a review (authenticated, verified buyer only)
GET  /api/reviews/my               → Get current user's reviews (all statuses)
GET  /api/reviews/eligible         → Get products the user can review (purchased, no existing review, not blocked)
PUT  /api/reviews/[id]/moderate    → Approve/reject review with reason (admin only)
GET  /api/reviews/pending          → Get pending reviews with count (admin only)
DELETE /api/reviews/[id]           → Delete rejected review to allow resubmission (system/admin)
```

### Review Business Rules

```
Eligibility:
  - User must be authenticated
  - User must have a completed order containing the product
  - At least 1 day must have passed since order completion
  - No existing pending/approved review for that product by this user
  - rejection_count < 2 for that user+product combination

Submission:
  - Rating: 1-5 stars (required)
  - Text: minimum 20 characters (required)
  - Photos: optional, max 3 images, max 5MB each
  - Status set to "pending" on submission

Moderation:
  - Admin sees pending reviews in dashboard with badge count
  - Approve: status → "approved", points awarded (50 text / 100 with photo)
  - Reject: status → "rejected", rejection_reason set, rejection_count incremented
    - No points awarded on rejection

Resubmission:
  - On rejection, old review row is deleted
  - User can submit new review if rejection_count < 2
  - rejection_count is tracked in a separate review_attempts table (persists across deletions)
  - After 2nd rejection for same product: blocked permanently

Display:
  - Only "approved" reviews shown on product page
  - Newest first
  - Shows: user name, tier badge, rating, text, photo (if any), date, "Verified Purchase" badge
  - No editing after approval (contact support to change)
```

### Modified Existing Endpoints

```
POST /api/orders/create            → Add: referral_code field, reward_code_id field
GET  /api/products                 → Add: early_access filtering based on user tier
POST /api/auth/signup              → Add: auto-create loyalty account, apply referral code
```

### API Response Shapes

```typescript
// GET /api/loyalty/account
{
  data: {
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
    perks: string[];
  }
}

// POST /api/loyalty/redeem
Request:  { points: 500 | 1000 | 2000 }
Response: { data: { code: string; discount_amount: number; expires_at: string } }

// POST /api/reviews
Request:  { product_id: string; order_id: string; rating: number; text: string; images?: File[] }
Response: { data: { id: string; status: "pending"; message: string } }
```

## Authentication & Authorization

| Action | Auth Required | Role Required |
|--------|--------------|---------------|
| View own loyalty account | Yes | Any authenticated user |
| Earn points | Yes (automatic) | Any authenticated user |
| Redeem points | Yes | Any authenticated user |
| Submit review | Yes | Any authenticated user (must have purchased product) |
| View approved reviews | No | Public |
| Moderate reviews | Yes | Admin or Manager |
| Adjust points manually | Yes | Admin only |
| View loyalty analytics | Yes | Admin or Manager |

## File/Folder Structure (New Files)

```
src/
├── app/
│   ├── (marketplace)/
│   │   └── profile/
│   │       └── rewards/
│   │           ├── page.tsx              # Loyalty dashboard
│   │           ├── history/
│   │           │   └── page.tsx          # Points history
│   │           └── refer/
│   │               └── page.tsx          # Referral page
│   ├── (admin)/
│   │   └── dashboard/
│   │       ├── reviews/
│   │       │   └── page.tsx              # Review moderation
│   │       └── loyalty/
│   │           └── page.tsx              # Loyalty analytics
│   └── api/
│       ├── loyalty/
│       │   ├── account/
│       │   │   ├── route.ts              # GET/POST loyalty account
│       │   │   └── birthday/
│       │   │       └── route.ts          # PUT birthday
│       │   ├── transactions/
│       │   │   └── route.ts              # GET points history
│       │   ├── points/
│       │   │   └── award/
│       │   │       └── route.ts          # POST admin points adjustment
│       │   ├── redeem/
│       │   │   └── route.ts              # POST redeem points
│       │   ├── reward-codes/
│       │   │   └── route.ts              # GET active reward codes
│       │   └── referral/
│       │       ├── route.ts              # GET referral info
│       │       └── apply/
│       │           └── route.ts          # POST apply referral code
│       └── reviews/
│           ├── route.ts                  # POST create review
│           ├── my/
│           │   └── route.ts              # GET user's reviews
│           ├── pending/
│           │   └── route.ts              # GET pending reviews (admin)
│           └── [id]/
│               └── moderate/
│                   └── route.ts          # PUT approve/reject
├── components/
│   ├── loyalty/
│   │   ├── LoyaltyDashboard.tsx          # Main dashboard UI
│   │   ├── TierBadge.tsx                 # Tier icon component (Bronze/Silver/Gold)
│   │   ├── TierProgress.tsx              # Progress bar to next tier
│   │   ├── PointsHistory.tsx             # Transaction list
│   │   ├── PerksChecklist.tsx            # Available/locked perks
│   │   ├── NavbarLoyaltyBadge.tsx        # Compact badge for header
│   │   ├── CheckoutLoyalty.tsx           # Checkout points integration
│   │   ├── ReferralCard.tsx              # Referral code + share buttons
│   │   └── RedeemModal.tsx              # Points redemption modal
│   └── reviews/
│       ├── ReviewForm.tsx                # Review submission with photo upload
│       ├── ReviewList.tsx                # Product review display
│       ├── ReviewCard.tsx                # Single review card
│       ├── StarRating.tsx                # Interactive star rating input
│       └── ReviewModeration.tsx          # Admin review management
├── services/
│   └── loyaltyService.ts                # Business logic for points, tiers, referrals
└── store/
    └── loyaltyStore.ts                   # Zustand store for client-side loyalty state
```

## External Services & APIs

| Service | Usage | Cost |
|---------|-------|------|
| Supabase Storage | Review photo uploads | Included in existing plan |
| WhatsApp Business API | Tier upgrade notifications, birthday rewards | Existing integration |
| Supabase Database | New tables (~5) | Included in existing plan |

No new external services required.

## Environment Variables

No new environment variables required. The system uses existing Supabase and app configuration:

```
NEXT_PUBLIC_SUPABASE_URL        # Existing
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Existing
SUPABASE_SERVICE_ROLE_KEY       # Existing (for admin operations)
```
