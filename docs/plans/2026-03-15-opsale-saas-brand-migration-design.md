# OpSale SaaS — Brand Reskin, Supabase Migration & Landing Page Design

**Date:** 2026-03-15
**Status:** Approved
**Scope:** Phase 1 of OpSale SaaS transition — rebrand existing codebase, migrate Supabase, build landing page

---

## 1. Project Context

The existing codebase (`Leeztruestyles.com`) is a working Next.js 14 + Supabase fashion marketplace with loyalty, POS, admin dashboard, inventory, and checkout. It serves as the technical foundation for OpSale — a multi-tenant SaaS platform targeting small, medium, and large business owners globally.

**Approach:** Rebrand first (make the app look and feel like OpSale), migrate Supabase to a dedicated OpSale project, then build the marketing landing page. White-glove onboarding model — businesses sign up via landing page, founder onboards them manually.

---

## 2. Git Setup

Push existing codebase to the new OpSale repository as the starting point:

```bash
git remote add opsale https://github.com/DennisBundi/opsale.git
git push opsale main
```

All future work happens on `github.com/DennisBundi/opsale.git`.

---

## 3. Brand System

### Color Tokens

| Token | Hex | Name | Usage |
|---|---|---|---|
| `--color-bg` | `#080F1E` | Space Navy | Page backgrounds |
| `--color-surface` | `#1A2E4A` | Deep Slate | Cards, panels, surfaces |
| `--color-primary` | `#00C896` | Teal Prime | CTAs, active states, links, brand highlight |
| `--color-accent` | `#F5A623` | Reward Gold | Loyalty, badges, premium tier indicators |
| `--color-text` | `#F4F8FF` | Cloud White | All text, light mode surfaces |

### Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display / Wordmark | Syne | 800 | Headings, logo, page titles |
| Body / UI | DM Sans | 300–500 | Body text, labels, dashboard data |

Google Fonts import:
```
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
```

### Glassmorphism Pattern

Applied to all cards, modals, panels, and dashboard widgets:

```css
/* Standard glass */
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 0.5px solid rgba(255, 255, 255, 0.12);
border-radius: 16px;

/* Strong glass (hero cards, auth forms) */
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
border: 0.5px solid rgba(255, 255, 255, 0.18);
border-radius: 16px;
```

### Atmospheric Orbs

Used on hero, dashboard, and auth pages — blurred radial gradients behind UI:

```css
.orb-teal  { background: rgba(0, 200, 150, 0.18); filter: blur(60px); }
.orb-gold  { background: rgba(245, 166, 35, 0.12); filter: blur(60px); }
.orb-blue  { background: rgba(0, 120, 255, 0.10); filter: blur(60px); }
```

### Logo

- Mark: Green gradient square `#00C896 → #009970`, rounded corners, dark icon inside
- Wordmark: `Op` in Cloud White + `Sale` in Teal Prime, Syne 800
- Tagline: `Sell. Retain. Grow.` in Teal Prime at 80% opacity
- Sub-label: `Business Operating System` in uppercase spaced caps at 35% opacity

---

## 4. Supabase Migration

### Source
Current Leeztruestyles Supabase project (existing `.env.local`)

### Target
New OpSale Supabase project: `omwdobgdsstpglvqmmuk.supabase.co`

### Migration Steps

1. **Install Supabase CLI** if not already present
2. **Link source project** and dump schema:
   ```bash
   supabase db dump --schema public > schema.sql
   supabase db dump --data-only > data.sql
   ```
3. **Link target project** and apply:
   ```bash
   supabase db push --db-url postgresql://...@omwdobgdsstpglvqmmuk.supabase.co/postgres
   psql ... < schema.sql
   psql ... < data.sql
   ```
4. **Verify** row counts match between source and target
5. **Update `.env.local`**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://omwdobgdsstpglvqmmuk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key from new project dashboard>
   ```
6. **Update Vercel environment variables** to point to new Supabase project
7. **Configure Auth** in new Supabase project: email templates, redirect URLs, OAuth providers

---

## 5. Screen Reskin Scope

All screens get the OpSale brand system applied. Priority order:

| Priority | Screen/Component | Key Changes |
|---|---|---|
| 1 | `tailwind.config.ts` + global CSS | Add brand color tokens, import fonts |
| 2 | Shared components (Navbar, Footer, buttons) | OpSale logo, teal/gold tokens, glass surfaces |
| 3 | Auth pages (signin/signup) | Space Navy bg, atmospheric orbs, glass card form |
| 4 | Admin dashboard | Full dark glassmorphism, teal active states, gold loyalty accents |
| 5 | Marketplace home | OpSale brand hero, teal CTAs |
| 6 | Product pages, cart, checkout | Teal/gold accents replacing current pink |
| 7 | Loyalty pages | Gold accent theme throughout |
| 8 | POS, inventory, orders, settings | Consistent dark glass panels |

---

## 6. Landing Page Design

### Purpose
Capture business interest. Visitors learn about OpSale, then submit an interest form. Founder receives notification, reaches out personally, and onboards them.

### Page Sections (single page)

1. **Hero** — Logo, tagline "Sell. Retain. Grow.", sub-headline explaining the platform, primary CTA button "Get Your Store" scrolls to form. Atmospheric orbs background.
2. **Problem / Value Prop** — 3 pain points businesses face, OpSale's answer to each
3. **4 Modules** — Record-first, Loyalty built-in, Smart admin, Global-ready (brand pillars from design system)
4. **Pricing tiers** — Starter $19/mo, Growth $49/mo, Pro $99/mo, Enterprise custom. Glass cards.
5. **Interest / Signup Form** — Glass card form collecting:
   - Full name
   - Email address
   - Business name
   - Business category (Retail / Fashion / Food & Beverage / Services / Other)
   - Team size (Solo / 2–5 / 6–20 / 20+)
   - Country
   - Submit → saves to Supabase `waitlist` table, sends confirmation email
6. **Footer** — Logo, tagline, social links

### Post-submit Flow
- Entry saved to `waitlist` table in Supabase
- Confirmation email sent to business owner via Supabase Auth email or Resend
- Founder notified (email or WhatsApp webhook)
- Founder manually reaches out within 24–48 hrs to begin onboarding

---

## 7. Success Criteria

- [ ] Codebase pushed to `github.com/DennisBundi/opsale.git`
- [ ] All existing screens use OpSale brand tokens (no Leeztruestyles pink remaining)
- [ ] Supabase data fully migrated to new project, app runs without errors
- [ ] Landing page live with working interest form
- [ ] Form submissions appear in Supabase `waitlist` table
- [ ] App deploys cleanly on Vercel pointing to new Supabase project
