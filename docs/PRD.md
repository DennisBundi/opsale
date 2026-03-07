# Product Requirements Document: Leez Rewards

## Overview
Leez Rewards is a layered loyalty program for Leeztruestyles.com that incentivizes repeat purchases, referrals, and user-generated content through a points-based system with three VIP tiers (Bronze, Silver, Gold). Designed for the Kenyan Gen Z/millennial market, it prioritizes perceived value (exclusivity, status, early access) over margin-heavy discounts.

## Problem Statement
Leeztruestyles has growing online traffic but poor customer retention. Shoppers buy once and don't return, making growth dependent on new customer acquisition instead of maximizing customer lifetime value.

## Target Users & Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| Online Customer | Registered user who shops on leeztruestyles.com | Earn/redeem points, view loyalty dashboard, refer friends, write reviews, track tier progress |
| Admin/Manager | Store staff with admin access | View loyalty analytics, manage reviews (approve/reject), adjust points manually, configure reward tiers |

## Functional Requirements

### Must-Have (MVP)

| ID | Feature | Description | Acceptance Criteria |
|----|---------|-------------|-------------------|
| F1 | Loyalty Account Creation | Auto-create loyalty account when user signs up or makes first purchase | Account created with Bronze tier, 0 points, prompted for birthday |
| F2 | Points on Purchase | Award 1 point per KSh 10 spent on completed online orders | Points credited after order status = "completed"; points transaction logged |
| F3 | Referral System | Users get unique referral code; 200 points when referred friend completes first order | Referral code generated on account creation; friend gets KSh 50 off first order; points only awarded after friend's first completed purchase |
| F4 | Review Rewards | 50 points for text review, 100 points for review with photo | Min 20 characters for text; max 3 photos, 5MB each; one review per product per user; only for verified buyers (completed order + 1 day elapsed); points awarded only after admin approval |
| F5 | Points Redemption | 500 points = KSh 50 off; 1,000 points = KSh 100 off; 2,000 points = KSh 250 off | Discount code generated and auto-applied at checkout; points deducted immediately on redemption |
| F6 | 3-Tier VIP System | Bronze (0pts), Silver (2,000pts), Gold (5,000pts) with increasing perks | Tier auto-upgrades when threshold reached; tier based on total_points_earned (lifetime), not current balance |
| F7 | Birthday Reward | 5% discount code during birthday month | Birthday locked after first entry; discount code auto-generated on 1st of birthday month; single-use, expires end of month |
| F8 | Early Access - New Drops | Silver+ users see new products 24hrs before general release | Products with `early_access_until` timestamp; filtered in product queries based on tier |
| F9 | Early Access - Flash Sales | Gold users see flash sales 48hrs before general release | Flash sale `early_access_until` timestamp; Gold users bypass the filter |
| F10 | Free Shipping - Silver | Free shipping on orders over KSh 2,000 for Silver tier | Shipping cost set to 0 at checkout when conditions met |
| F11 | Free Shipping - Gold | Free shipping on all orders for Gold tier | Shipping cost always 0 at checkout for Gold members |
| F12 | Loyalty Dashboard | Profile page showing points balance, tier, progress bar, perks, history | Accessible from profile page and navbar badge |
| F13 | Points History | Chronological log of all points earned and redeemed | Filterable by type (purchase, referral, review, redemption, birthday) |
| F14 | Navbar Loyalty Badge | Tier icon + points balance visible in header | Updates in real-time after earning/redeeming; shows on all pages |
| F15 | Checkout Integration | Show points available, allow redemption, show points to be earned | Display earning preview and redemption option on checkout page |
| F16 | Review Moderation | Admin must approve every review before it goes live; reject with preset reason | Reviews always start as "pending"; Approve = live on site + points awarded; Reject = hidden + reason logged (inappropriate_content / spam_low_effort / not_relevant) + no points; customer can resubmit once after rejection; blocked after 2nd rejection for same product |
| F17 | Review Entry Points | Customers can write reviews from product page AND order history | "Write a Review" button on product page (below product details) for purchased products; "Review" button next to each item in order history; both link to same review form |
| F18 | Review Eligibility Check | System verifies buyer status before showing review form | Must be signed in; must have completed order with that product; order must be completed for at least 1 day; no existing pending/approved review for that product; not blocked (rejection_count < 2) |
| F19 | Review Display | Approved reviews shown on product page with rating summary | Show average rating + star breakdown; newest reviews first; display reviewer name + tier badge + rating + text + photo + date + "Verified Purchase" badge; no editing after approval |

### Should-Have (Post-MVP)

| ID | Feature | Description |
|----|---------|-------------|
| S1 | POS Loyalty Integration | Link loyalty to phone number for in-store purchases |
| S2 | Social Sharing Rewards | Points for sharing products on WhatsApp/Instagram |
| S3 | Streak Bonuses | Bonus points for consecutive monthly purchases |
| S4 | Customer Leaderboard | Top customers showcase on site |
| S5 | Push Notifications | Tier upgrade alerts, point expiry reminders |
| S6 | Gold-Only Collections | Exclusive product collections visible only to Gold members |
| S7 | Points Expiry | Points expire after 12 months of account inactivity |

### Out of Scope
- POS / in-store loyalty (future phase)
- M-Pesa cashback for point redemption
- Repeat visit tracking
- Social sharing verification
- Third-party loyalty platform integrations
- Physical loyalty cards

## Non-Functional Requirements

- **Performance**: Loyalty dashboard loads within 2 seconds; points calculation should not add more than 200ms to checkout
- **Security**: Referral abuse prevention (unique phone per account, completed payment required); rate limiting on review submissions; admin-only points adjustment
- **Data Integrity**: Points transactions are atomic — no partial credits/debits; tier calculations based on immutable total_points_earned
- **Scalability**: System should handle up to 10,000 loyalty accounts without degradation

## Success Metrics
- **Repeat purchase rate**: Increase from current baseline by 20% within 3 months
- **Referral conversion**: At least 10% of new signups via referral codes
- **Review engagement**: At least 15% of completed orders receive a review
- **Tier progression**: At least 30% of Bronze users reach Silver within 6 months
- **Average order frequency**: Increase from current baseline by 1 additional order per quarter
