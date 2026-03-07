# Project Brainstorm: Leez Rewards

## Problem Statement
Leeztruestyles has growing online traffic but struggles with customer retention and repeat engagement. Customers buy once and don't return consistently, leaving growth dependent on acquiring new customers rather than maximizing lifetime value.

## Target Users
Gen Z and millennial fashion shoppers in Kenya, primarily buying online for themselves. Price-conscious but responsive to exclusivity, gamification, and social proof. Heavy WhatsApp and social media users.

## Core Value Proposition
A layered loyalty program that goes beyond basic points — combining status tiers, milestone unlocks, referrals, and user-generated content to create an engagement loop that feels exciting rather than transactional. Designed specifically for the Kenyan market with low margin impact (rewards are mostly perceived value: status, access, exclusivity).

## MVP Features
- [ ] Points system: Earn 1 point per KSh 10 spent on purchases
- [ ] Referral rewards: 200 points when a referred friend completes their first order
- [ ] Review rewards: 50 points for a text review, 100 points for a review with photo (fit pic)
- [ ] Points redemption: 500 points = KSh 50 discount on next order (~2-3% cashback equivalent)
- [ ] 3-tier VIP system (Bronze / Silver / Gold)
  - Bronze: Sign up + first purchase. Earn points, birthday 5% off, reviews & referrals
  - Silver: 2,000 points (~5-6 orders). Early access to new drops, free shipping on orders over KSh 2,000
  - Gold: 5,000 points (~12-15 orders). 48hr early access to flash sales, free shipping on all orders, exclusive Gold-only deals
- [ ] Birthday rewards: 5% discount during birthday month
- [ ] Loyalty dashboard in user profile (points balance, tier status, progress to next tier)
- [ ] Points history log (earned, redeemed, expired)
- [ ] Online customers only (no POS integration for MVP)

## Nice-to-Have (Post-MVP)
- POS in-store loyalty integration (link points to phone number or account)
- Social sharing rewards (share product on WhatsApp/Instagram for bonus points)
- Streak bonuses (purchase 3 months in a row = bonus points)
- Leaderboard / top customers showcase
- M-Pesa cashback option for point redemption
- Gamified badges and achievement system
- Push notifications for tier upgrades and point expiry reminders
- Tier-exclusive product collections

## Out of Scope
- POS / in-store loyalty (future phase)
- M-Pesa cashback (margin risk)
- Repeat visit tracking (low impact for fashion)
- Complex social sharing verification
- Third-party loyalty platform integrations
- Physical loyalty cards

## Suggested Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 (existing) | Already the app's framework, add loyalty UI components |
| Backend | Next.js API Routes + Supabase | Keep consistent with existing architecture |
| Database | Supabase (PostgreSQL) | New tables: loyalty_points, loyalty_tiers, referrals, reviews |
| State | Zustand (existing) | Add loyalty store for client-side state |
| Notifications | WhatsApp Business API (existing) | Tier upgrades, birthday rewards, point reminders |
| Hosting | Vercel + Supabase (existing) | No new infrastructure needed |

## Key Risks & Unknowns
- **Points economy balance**: Setting the right earn/redeem ratio so it feels rewarding without eroding margins. Will need monitoring and adjustment after launch.
- **Referral abuse**: Users creating fake accounts to earn referral points. Need verification (unique phone numbers, completed orders with payment).
- **Review quality**: Users posting low-effort reviews just for points. May need moderation or minimum character requirements.
- **Birthday verification**: Users entering fake birthdays to get discounts sooner. Consider locking birthday after first entry.
- **Tier downgrade policy**: Do tiers reset annually or are they lifetime? Annual reset encourages ongoing engagement but may frustrate users.
- **Points expiry**: Need to decide if/when points expire (e.g., 12 months of inactivity) to manage liability.

## Database Schema (Preliminary)

```
loyalty_accounts: id, user_id, tier (bronze/silver/gold), total_points_earned, current_points, birthday, created_at
loyalty_transactions: id, user_id, type (purchase/referral/review/redemption/birthday), points, order_id?, description, created_at
referrals: id, referrer_id, referred_id, referral_code, status (pending/completed), points_awarded, created_at
reviews: id, user_id, product_id, order_id, rating, text, image_urls, points_awarded, status (pending/approved), created_at
```

## Next Step
Run `/plan` to create a detailed implementation plan from this brainstorm.
