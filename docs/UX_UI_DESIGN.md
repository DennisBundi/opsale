# UX/UI Design: Leez Rewards

## Design System

### Color Palette

Extends the existing Leeztruestyles pink theme:

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Primary | Light Pink | #f9a8d4 | Buttons, badges, active states |
| Primary Dark | Medium Pink | #f472b6 | Hover states, accents |
| Primary Light | Very Light Pink | #fbcfe8 | Backgrounds, subtle fills |
| Bronze Tier | Warm Bronze | #CD7F32 | Bronze badge, bronze UI elements |
| Silver Tier | Cool Silver | #9CA3AF | Silver badge, silver UI elements |
| Gold Tier | Rich Gold | #F59E0B | Gold badge, gold UI elements |
| Points Earned | Green | #10B981 | Positive points transactions |
| Points Spent | Red | #EF4444 | Redemptions, negative transactions |
| Review Stars | Yellow | #FBBF24 | Star rating display |
| Locked Perks | Gray | #9CA3AF | Unavailable/locked features |

### Typography

Follows existing site typography:
- Headings: Bold, tracking-tight, text-gray-900
- Body: Regular, text-gray-600
- Points/Numbers: Bold, slightly larger for emphasis
- Tier Names: Uppercase, font-bold, letter-spacing

### Component Patterns

- **Cards**: White bg, rounded-lg (note: site uses rounded-none for buttons), shadow-sm, border border-gray-100
- **Buttons**: rounded-none (matching existing), font-semibold, hover:scale-105 transition
- **Badges**: Inline-flex, small text, rounded-full for tier badges
- **Progress bars**: Rounded-full, bg-gray-200 track, gradient fill
- **Modals**: Centered overlay, white card, backdrop blur

## Page/Screen Inventory

| Page | Route | Purpose | Key Components | Access |
|------|-------|---------|---------------|--------|
| Loyalty Dashboard | `/profile/rewards` | Main loyalty hub | TierBadge, TierProgress, PerksChecklist, PointsSummary | Authenticated |
| Points History | `/profile/rewards/history` | Transaction log | PointsHistory, FilterTabs | Authenticated |
| Referral Page | `/profile/rewards/refer` | Share & track referrals | ReferralCard, ReferralList | Authenticated |
| Product Detail | `/products/[id]` (existing) | Reviews section added | ReviewList, ReviewForm, StarRating | Public (review form: auth) |
| Checkout | `/checkout` (existing) | Points integration | CheckoutLoyalty | Authenticated |
| Profile | `/profile` (existing) | Birthday + rewards link | Birthday input, rewards link | Authenticated |
| Navbar | Global (existing) | Loyalty badge | NavbarLoyaltyBadge | Authenticated |
| Review Moderation | `/dashboard/reviews` | Admin review queue | ReviewModeration | Admin/Manager |
| Loyalty Analytics | `/dashboard/loyalty` | Admin loyalty stats | LoyaltyAnalytics | Admin/Manager |

## User Flows

### Flow 1: New User Onboarding with Referral

```
1. Friend shares referral link via WhatsApp
   → leeztruestyles.com/signup?ref=JOYLEE2026

2. User lands on signup page
   → Referral code auto-filled
   → "Joy invited you! Get KSh 50 off your first order"

3. User signs up
   → Loyalty account created (Bronze tier, 0 points)
   → Referral linked (status: pending)
   → Welcome message: "Welcome to Leez Rewards! You're now a Bronze member"

4. User makes first purchase
   → KSh 50 referral discount auto-applied
   → Points earned on purchase
   → Referral marked "completed"
   → Referrer (Joy) gets 200 points notification
```

### Flow 2: Purchase → Earn Points

```
1. User shops and checks out
   → Checkout shows: "You'll earn +150 pts from this order"
   → Optional: Apply reward code for discount

2. Order completed (payment confirmed)
   → Points automatically credited
   → Notification: "You earned 150 points! Balance: 1,000 pts"

3. If tier threshold crossed
   → "Congratulations! You've reached Silver tier!"
   → New perks unlocked notification
```

### Flow 3: Submit Review → Earn Points

```
Entry Point A: Product Page
1. User visits product they purchased (completed order, 1+ day ago)
   → "Write a Review" section visible below product details
   → "Earn up to 100 pts" indicator
   → If not eligible: section hidden (not purchased / too soon / already reviewed / blocked)

Entry Point B: Order History
1. User views completed order
   → "Review" button next to each item (only if eligible)
   → Links to same review form on product page

Submission:
2. User writes review
   → Select star rating (1-5 stars, required)
   → Write text (min 20 characters, character count shown)
   → Optional: Upload up to 3 fit pic photos (max 5MB each)
   → Preview before submit

3. User submits
   → "Review submitted! It will be visible after admin approval."
   → Review status: "pending"
   → User can see their pending review in "My Reviews" section

Moderation:
4. Admin sees pending review in Dashboard → Reviews tab (badge with pending count)
   → Preview: product thumbnail, reviewer name + tier, rating, full text, photos
   → Two buttons: "Approve" | "Reject"

5a. Admin approves
   → Review goes live on product page
   → Points awarded (50 text-only / 100 with photo)
   → Shows in product's review section with "Verified Purchase" badge

5b. Admin rejects (selects reason: inappropriate / spam / not relevant)
   → Review hidden from product page
   → No points awarded
   → Rejected review deleted from reviews table
   → rejection_count incremented in review_attempts table
   → If rejection_count < 2: customer can resubmit a new review
   → If rejection_count = 2: permanently blocked for that product

No editing:
   → Approved reviews cannot be edited by the customer
   → Customer contacts support if they need changes
```

### Flow 4: Redeem Points

```
1. User opens loyalty dashboard or checkout
   → Sees current points: 850

2. Clicks "Redeem Points"
   → Modal shows options:
     ✓ 500 pts → KSh 50 off [Redeem]
     ✗ 1,000 pts → KSh 100 off [Need 150 more]
     ✗ 2,000 pts → KSh 250 off [Need 1,150 more]

3. User selects 500 pts redemption
   → Confirms: "Use 500 points for KSh 50 off?"
   → Code generated: LEEZ-XXXXX
   → Points deducted: 850 → 350

4. At checkout
   → Reward code auto-applied or manually entered
   → Discount reflected in order total
```

### Flow 5: Referral Sharing

```
1. User visits /profile/rewards/refer
   → Sees unique code: JOYLEE2026
   → Stats: 2 completed, 1 pending

2. Taps "Share on WhatsApp"
   → Pre-filled message:
     "Hey! Use my code JOYLEE2026 to get KSh 50 off at Leeztruestyles.
      Shop here: leeztruestyles.com/signup?ref=JOYLEE2026"

3. Friend signs up with code
   → Referral appears as "pending" in Joy's list

4. Friend completes first purchase
   → Referral status → "completed"
   → Joy gets 200 points
```

## Wireframe Descriptions

### Loyalty Dashboard (`/profile/rewards`)

**Header Section:**
- Left: TierBadge (large, with tier color gradient background)
- Right: "Welcome back, [Name]!"
- Below: Tier name in uppercase with tier color

**Progress Section:**
- Full-width card with rounded corners
- Current tier indicator on left, next tier on right
- Animated progress bar between them (gradient fill matching next tier color)
- Text below: "[X] / [Y] pts to [Next Tier]" with percentage

**Points Summary:**
- 3 stat cards in a row (responsive: stack on mobile)
  - Current Points (large bold number)
  - Total Earned (smaller)
  - Total Redeemed (smaller)

**Perks Section:**
- Card with "Your Perks" heading
- List items with checkmark (available, primary color) or lock icon (unavailable, gray)
- Locked perks show "(Unlock at [Tier])" in gray text

**Action Buttons:**
- Two primary buttons side by side: "Redeem Points" | "Refer a Friend"
- Below: Link to "View Points History"

### Navbar Badge

**Desktop:**
- Positioned next to cart icon in header
- Small tier icon (colored circle with tier initial: B/S/G)
- Points number next to it (e.g., "850")
- Clickable → navigates to /profile/rewards

**Mobile:**
- Same badge in mobile menu user section
- Below user name/email

### Checkout Integration

**Checkout Page — New Section (between items and payment):**
- Card titled "Leez Rewards"
- Left side: Current points balance
- Right side: "Apply reward code" dropdown/input
- If reward code active: shows discount amount in green
- Bottom: "You'll earn +[X] pts from this order" in primary color
- If tier upgrade possible: "This purchase will upgrade you to [Tier]!"

### Product Review Section

**On Product Detail Page — Below product info:**

**Review Summary Bar:**
- Left: Average rating as large number (e.g., "4.7") + filled stars
- Center: Total review count (e.g., "23 reviews")
- Right: Rating breakdown — horizontal bars for 5-star through 1-star with counts
- If no reviews yet: "No reviews yet. Be the first to review this product!"

**Review Form (only visible when eligible):**
- Eligibility check: signed in + purchased product + order completed 1+ day + no existing review + not blocked
- If not signed in: "Sign in to write a review"
- If not purchased: form hidden entirely (no message, avoids confusion)
- If order too recent: "You can review this product after [date]"
- If already reviewed (pending): "Your review is under review"
- If already reviewed (approved): "You've already reviewed this product"
- If blocked (2 rejections): form hidden entirely

**When eligible:**
- Banner: "Write a Review — Earn up to 100 pts"
- Star rating selector (5 clickable stars, required, highlight on hover)
- Textarea with placeholder "Tell us about this product..." and live character count (min 20)
- "Upload Fit Pics" button with camera icon — "+50 bonus pts" label
  - Max 3 photos, 5MB each
  - Image previews with remove button
- Submit button: "Submit Review" (disabled until rating + 20 chars met)
- Preview step before final submission

**Review List:**
- Cards for each approved review, newest first
- Each card:
  - Header row: User first name + last initial, TierBadge (Bronze/Silver/Gold), star rating, date
  - "Verified Purchase" badge (green checkmark)
  - Review text
  - Photo thumbnails (if uploaded) — clickable to expand in lightbox
- Pagination or "Load more" if many reviews

### Order History Review Buttons

**On order history / order detail page:**
- Each completed order item shows a "Review" button (if eligible)
- Button states:
  - "Write Review" — eligible, no review yet
  - "Pending Review" (gray) — review submitted, awaiting approval
  - "Reviewed" (checkmark) — review approved and live
  - No button — not eligible (too recent, blocked, etc.)
- Clicking "Write Review" navigates to product page scrolled to review form

### Referral Page (`/profile/rewards/refer`)

**Hero Card:**
- Gradient background (primary colors)
- "Share your code, earn 200 pts"
- "Your friend gets KSh 50 off too!"
- Large referral code in a bordered box
- Two buttons: "Copy Code" | "Share on WhatsApp"

**How It Works:**
- 3-step horizontal layout (vertical on mobile)
- Step 1: Share your code (share icon)
- Step 2: They sign up & buy (user icon)
- Step 3: You both earn (gift icon)
- Arrows between steps

**Your Referrals:**
- List of referrals with status badges
- Completed: Green badge + points earned
- Pending: Yellow badge + "Awaiting purchase"

### Redeem Modal

**Overlay modal (centered on desktop, bottom sheet on mobile):**
- Header: "Redeem Points" + current balance
- List of redemption options as selectable cards:
  - Available: White card, border-primary, "Redeem" button
  - Locked: Gray card, disabled, "Need X more points" text
- Confirmation step: "Use [X] points for KSh [Y] off?"
- Success state: Shows generated code with copy button

### Admin Review Moderation (`/dashboard/reviews`)

**Stats Bar:**
- Pending count (with red badge) | Approved today | Rejected today | Total reviews

**Filter Tabs:**
- Pending (default) | Approved | Rejected | All

**Review Queue:**
- Card list of reviews (sorted by submission date, oldest pending first)
- Each card shows:
  - Product thumbnail + product name
  - Reviewer name + tier badge + email
  - Star rating display
  - Full review text
  - Photo thumbnails (clickable to expand)
  - Submission date
  - If previously rejected: "Resubmission (attempt 2 of 2)" warning badge

**Action Buttons (for pending reviews):**
- "Approve" (green button)
  - Immediately: review goes live, points awarded
  - Shows confirmation: "Review approved. +[50/100] pts awarded to [name]"
- "Reject" (red button)
  - Opens dropdown with preset reasons:
    - Inappropriate content
    - Spam / low effort
    - Not relevant to product
  - Must select reason before confirming
  - Shows confirmation: "Review rejected. [Name] has [0/1] resubmission(s) remaining"

**Approved/Rejected tabs:**
- Same card layout but read-only
- Rejected cards show rejection reason badge
- No action buttons
