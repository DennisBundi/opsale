# Development Roadmap: Leez Rewards

## Phase 1: Database Foundation & Core Service

### 1.1 Database Schema
- [ ] Create `loyalty_accounts` table with RLS policies (~1hr)
- [ ] Create `loyalty_transactions` table with RLS policies (~1hr)
- [ ] Create `referrals` table with RLS policies (~1hr)
- [ ] Create `reviews` table with RLS policies (~1hr)
- [ ] Create `review_attempts` table with RLS policies (~30min)
- [ ] Create `reward_codes` table with RLS policies (~1hr)
- [ ] Add `early_access_until` column to products table (~30min)
- [ ] Add `reward_code_id`, `points_earned`, `referral_code` columns to orders table (~30min)
- [ ] Create all indexes (~30min)

### 1.2 Loyalty Service
- [ ] Create `src/services/loyaltyService.ts` with core methods (~3hrs)
  - `createAccount(userId)` — initialize Bronze account with referral code
  - `getAccount(userId)` — fetch account with computed tier progress
  - `awardPurchasePoints(userId, orderId, amount)` — 1pt per KSh 10
  - `awardReferralPoints(referrerId, referralId)` — 200pts
  - `awardReviewPoints(userId, reviewId, hasPhoto)` — 50 or 100pts
  - `redeemPoints(userId, points)` — generate reward code
  - `recalculateTier(userId)` — check total_points_earned against thresholds
  - `generateReferralCode(userId)` — unique code based on name + random
  - `getTransactionHistory(userId, options)` — paginated, filterable

### 1.3 Zustand Store
- [ ] Create `src/store/loyaltyStore.ts` (~1hr)
  - State: account, transactions, loading
  - Actions: fetchAccount, fetchTransactions, redeemPoints
  - Persist: no (always fetch fresh from server)

## Phase 2: API Routes

### 2.1 Loyalty API Routes
- [ ] `GET/POST /api/loyalty/account` — get or create loyalty account (~2hrs)
- [ ] `PUT /api/loyalty/account/birthday` — set birthday with lock (~1hr)
- [ ] `GET /api/loyalty/transactions` — paginated history with type filter (~1.5hrs)
- [ ] `POST /api/loyalty/redeem` — validate points, generate reward code (~2hrs)
- [ ] `GET /api/loyalty/reward-codes` — list active unused codes (~1hr)
- [ ] `GET /api/loyalty/referral` — get code + referral list (~1hr)
- [ ] `POST /api/loyalty/referral/apply` — validate and link referral at signup (~2hrs)
- [ ] `POST /api/loyalty/points/award` — admin-only manual adjustment (~1hr)

### 2.2 Review API Routes
- [ ] `POST /api/reviews` — submit review with optional photos (~3hrs)
  - Validate user is authenticated
  - Validate user has completed order with this product (order status = "completed")
  - Validate order completed at least 1 day ago
  - Check no existing pending/approved review for this user+product
  - Check review_attempts rejection_count < 2 for this user+product
  - Validate rating (1-5), text (min 20 chars)
  - Handle up to 3 image uploads to Supabase Storage (max 5MB each)
  - Create review with status = "pending"
- [ ] `GET /api/reviews/product/[id]` — fetch approved reviews for product (~1hr)
- [ ] `GET /api/reviews/product/[id]/summary` — rating avg, count, star breakdown (~1hr)
- [ ] `GET /api/reviews/eligible` — products the user can review (~1.5hrs)
  - Find completed orders older than 1 day
  - Exclude products with existing pending/approved review
  - Exclude products where rejection_count >= 2
- [ ] `GET /api/reviews/my` — user's own reviews (all statuses) (~1hr)
- [ ] `GET /api/reviews/pending` — admin pending queue with count (~1hr)
- [ ] `PUT /api/reviews/[id]/moderate` — approve or reject with reason (~2hrs)
  - Approve: set status = "approved", award points (50 text / 100 with photo)
  - Reject: set status = "rejected", set rejection_reason, increment rejection_count in review_attempts, then delete review row to allow resubmission
- [ ] `DELETE /api/reviews/[id]` — admin delete review (~30min)

### 2.3 Modify Existing Routes
- [ ] Update `POST /api/orders/create` — award points on completed order, apply reward codes (~2hrs)
- [ ] Update product queries — filter by early_access_until based on user tier (~1.5hrs)

## Phase 3: Frontend Components

### 3.1 Shared Components
- [ ] `TierBadge.tsx` — Bronze/Silver/Gold icon with color coding (~1hr)
  - Bronze: warm gray/bronze gradient
  - Silver: cool gray/silver gradient
  - Gold: warm yellow/gold gradient
- [ ] `StarRating.tsx` — Interactive star rating input + display (~1hr)

### 3.2 Loyalty Dashboard Page (`/profile/rewards`)
- [ ] `LoyaltyDashboard.tsx` — main dashboard layout (~3hrs)
  - Tier badge with name and welcome
  - Points balance (current, total earned, redeemed)
  - Progress bar to next tier with percentage
  - Perks checklist (available vs locked)
  - Quick action buttons (Redeem, Refer)
- [ ] `TierProgress.tsx` — animated progress bar component (~1hr)
- [ ] `PerksChecklist.tsx` — tier perks with check/lock icons (~1hr)

### 3.3 Points History Page (`/profile/rewards/history`)
- [ ] `PointsHistory.tsx` — chronological transaction list (~2hrs)
  - Type filter tabs (All, Purchases, Referrals, Reviews, Redeemed)
  - Color-coded entries (green = earned, red = spent)
  - Monthly grouping

### 3.4 Referral Page (`/profile/rewards/refer`)
- [ ] `ReferralCard.tsx` — referral code display + share buttons (~2hrs)
  - Copy code button
  - Share on WhatsApp button (pre-filled message with referral link)
  - How it works steps
  - Referral status list (pending/completed)

### 3.5 Redemption
- [ ] `RedeemModal.tsx` — modal/drawer for redeeming points (~2hrs)
  - Available redemption options (500, 1000, 2000 pts)
  - Locked options with "need X more points"
  - Confirm and generate code

### 3.6 Navbar Integration
- [ ] `NavbarLoyaltyBadge.tsx` — compact tier icon + points in header (~1.5hrs)
- [ ] Update `Header.tsx` — add loyalty badge next to cart icon (~1hr)

### 3.7 Checkout Integration
- [ ] `CheckoutLoyalty.tsx` — checkout page loyalty section (~2hrs)
  - Show available points
  - Apply reward code option
  - Points earning preview ("You'll earn +X pts")
- [ ] Update checkout page to include loyalty section (~1.5hrs)

### 3.8 Review Components
- [ ] `StarRating.tsx` — interactive star rating input + static display mode (~1hr)
- [ ] `ReviewForm.tsx` — review submission form (~3hrs)
  - Eligibility checks: signed in, purchased, 1 day elapsed, no existing review, not blocked
  - Show appropriate message for each ineligible state
  - Star rating selector (5 clickable stars)
  - Textarea with live character count (min 20)
  - Photo upload: up to 3 images, 5MB max each, preview with remove
  - Points indicator: "Earn 50 pts" or "Earn 100 pts (with photo)"
  - Preview step before submit
  - Success state: "Your review is under review"
- [ ] `ReviewSummary.tsx` — rating average + star breakdown bars (~1.5hrs)
- [ ] `ReviewList.tsx` — display approved reviews on product page, newest first (~1.5hrs)
- [ ] `ReviewCard.tsx` — single review card (~1.5hrs)
  - User name + tier badge + star rating + date
  - "Verified Purchase" badge
  - Review text
  - Photo thumbnails with lightbox expand
- [ ] Update product detail page to include ReviewSummary, ReviewList, ReviewForm (~2hrs)
- [ ] Add "Review" buttons to order history page for eligible items (~1.5hrs)

## Phase 4: Admin Features

### 4.1 Review Moderation
- [ ] `ReviewModeration.tsx` — admin page for pending reviews (~4hrs)
  - Stats bar: pending count (badged), approved today, rejected today, total
  - Filter tabs: Pending (default), Approved, Rejected, All
  - Card list: product thumbnail, reviewer name + tier + email, rating, full text, photos
  - Resubmission warning badge for 2nd attempts
  - Approve button: sets live + awards points + shows confirmation
  - Reject button: dropdown with preset reasons (inappropriate / spam / not relevant)
    - Must select reason, then confirm
    - Shows remaining resubmissions for that user+product
  - Approved/Rejected tabs: read-only with rejection reason badges

### 4.2 Loyalty Analytics (Basic)
- [ ] Admin loyalty dashboard page (~2hrs)
  - Total loyalty accounts by tier
  - Points issued vs redeemed
  - Top referrers
  - Review stats (pending, approved, rejected)

## Phase 5: Integration & Polish

### 5.1 Auto-Account Creation
- [ ] Hook into signup flow — create loyalty account on registration (~1.5hrs)
- [ ] Hook into first purchase — create account if not exists (~1hr)
- [ ] Apply referral code during signup if provided (~1hr)

### 5.2 Points Automation
- [ ] Award points when order status changes to "completed" (~2hrs)
- [ ] Award referral points when referred user's first order completes (~1.5hrs)
- [ ] Generate birthday reward code on 1st of birthday month (~2hrs)

### 5.3 Early Access Logic
- [ ] Filter new products by early_access_until for non-Silver+ users (~1.5hrs)
- [ ] Filter flash sales by early_access_until for non-Gold users (~1.5hrs)
- [ ] Add early access badge on product cards for eligible users (~1hr)

### 5.4 Shipping Integration
- [ ] Update checkout shipping calculation for Silver (free over KSh 2,000) (~1hr)
- [ ] Update checkout shipping calculation for Gold (always free) (~30min)

### 5.5 Profile Page Updates
- [ ] Add "Leez Rewards" link/section on profile page (~1hr)
- [ ] Add birthday input on profile page (if not yet set) (~1hr)

## Phase 6: Testing & Deployment

### 6.1 Testing
- [ ] Unit tests for loyaltyService (points calculation, tier logic) (~2hrs)
- [ ] Unit tests for referral code generation and validation (~1hr)
- [ ] API route tests for loyalty endpoints (~2hrs)
- [ ] API route tests for review endpoints (~1.5hrs)
- [ ] Manual E2E testing: full loyalty flow (signup → purchase → earn → redeem) (~2hrs)
- [ ] Manual E2E testing: referral flow (~1hr)
- [ ] Manual E2E testing: review flow with photo (~1hr)

### 6.2 Deployment
- [ ] Run database migrations on production Supabase (~30min)
- [ ] Verify RLS policies on production (~30min)
- [ ] Deploy to Vercel (~15min)
- [ ] Smoke test on production (~1hr)
- [ ] Monitor points economy for first week (~ongoing)

## Dependencies & Blockers

| Dependency | Blocker For | Notes |
|-----------|-------------|-------|
| Database schema (Phase 1.1) | Everything | Must be done first |
| Loyalty service (Phase 1.2) | All API routes | Core business logic |
| API routes (Phase 2) | All frontend | Components need endpoints |
| Supabase Storage bucket for reviews | Review photo upload | May need to create bucket |
| Existing order completion flow | Points automation | Need to understand when orders become "completed" |

## Estimated Timeline

| Phase | Duration | Key Deliverable |
|-------|----------|----------------|
| Phase 1: Foundation | 2-3 days | Database + service + store |
| Phase 2: API Routes | 3-4 days | All loyalty + review endpoints |
| Phase 3: Frontend | 5-6 days | All user-facing loyalty UI |
| Phase 4: Admin | 2 days | Review moderation + analytics |
| Phase 5: Integration | 3-4 days | Automation, early access, shipping |
| Phase 6: Testing | 2-3 days | Tests + deployment |
| **Total** | **~17-22 days** | **Full Leez Rewards MVP** |
