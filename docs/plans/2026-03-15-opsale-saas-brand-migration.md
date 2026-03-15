# OpSale SaaS — Brand Reskin, Supabase Migration & Landing Page

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand the existing Leeztruestyles codebase to OpSale, migrate Supabase to the new project, and build a landing page that captures business interest via a signup form.

**Architecture:** Same Next.js 14 App Router codebase — root `page.tsx` becomes the OpSale marketing/landing page, existing marketplace and admin routes remain. Brand tokens live in `tailwind.config.ts` and `globals.css`. Supabase migrated to `omwdobgdsstpglvqmmuk.supabase.co`.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Vercel. Fonts: Syne 800 (display), DM Sans (body) via Google Fonts.

---

## Task 1: Push codebase to new OpSale GitHub repo

**Files:**
- No file changes — git remote operation only

**Step 1: Add new remote**
```bash
git remote add opsale https://github.com/DennisBundi/opsale.git
```

**Step 2: Push main branch**
```bash
git push opsale main
```
Expected: Branch pushed successfully to `github.com/DennisBundi/opsale.git`

**Step 3: Verify**
```bash
git remote -v
```
Expected: Shows both `origin` and `opsale` remotes.

**Step 4: Set opsale as the default push remote going forward**
```bash
git remote set-url origin https://github.com/DennisBundi/opsale.git
git remote remove opsale
```

**Step 5: Commit**
No commit needed — remote config change only.

---

## Task 2: Supabase migration — export from source project

**Files:**
- No code changes — CLI operations

**Prerequisites:** Install Supabase CLI if not already installed:
```bash
npm install -g supabase
```

**Step 1: Get source project credentials**

From the current `.env.local`, note:
- `NEXT_PUBLIC_SUPABASE_URL` — this is the source project URL
- You need the source project's database password from Supabase dashboard → Project Settings → Database

**Step 2: Dump schema from source project**
```bash
supabase db dump --db-url "postgresql://postgres:[SOURCE_DB_PASSWORD]@[SOURCE_HOST]:5432/postgres" --schema public -f schema.sql
```

**Step 3: Dump data from source project**
```bash
supabase db dump --db-url "postgresql://postgres:[SOURCE_DB_PASSWORD]@[SOURCE_HOST]:5432/postgres" --data-only -f data.sql
```

**Step 4: Verify files exist**
```bash
ls -lh schema.sql data.sql
```
Expected: Both files present with non-zero sizes.

---

## Task 3: Supabase migration — import to new OpSale project

**Files:**
- Modify: `.env.local`

**Step 1: Get OpSale database password**

Go to Supabase dashboard for `omwdobgdsstpglvqmmuk.supabase.co` → Project Settings → Database → copy the database password.

Also get the service role key from Project Settings → API → `service_role` key.

**Step 2: Apply schema to new project**
```bash
psql "postgresql://postgres:[OPSALE_DB_PASSWORD]@db.omwdobgdsstpglvqmmuk.supabase.co:5432/postgres" -f schema.sql
```

**Step 3: Import data**
```bash
psql "postgresql://postgres:[OPSALE_DB_PASSWORD]@db.omwdobgdsstpglvqmmuk.supabase.co:5432/postgres" -f data.sql
```

**Step 4: Update `.env.local`**

Replace existing Supabase env vars with:
```
NEXT_PUBLIC_SUPABASE_URL=https://omwdobgdsstpglvqmmuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9td2RvYmdkc3N0cGdsdnFtbXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Nzc3NjcsImV4cCI6MjA4OTE1Mzc2N30.hqxhWjpDcUJA9Dqtq-k8htzqbkermW1A_jZgaboCvH8
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY_FROM_DASHBOARD]
```

**Step 5: Run dev server and verify app loads**
```bash
npm run dev
```
Open `http://localhost:3000` — products, auth, and admin should all work against the new Supabase project.

**Step 6: Create waitlist table in new Supabase project**

Run this SQL in the Supabase SQL editor:
```sql
create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null unique,
  business_name text not null,
  category text not null,
  team_size text not null,
  country text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table waitlist enable row level security;

-- Allow anyone to insert (public signup form)
create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);

-- Only service role can read
create policy "Service role reads waitlist"
  on waitlist for select
  using (auth.role() = 'service_role');
```

**Step 7: Commit**
```bash
git add .env.local
```
Note: `.env.local` is gitignored — do NOT commit it. Instead commit a note:
```bash
git add -p  # skip .env.local
git commit -m "chore: migrate to OpSale Supabase project"
```

---

## Task 4: Brand tokens — Tailwind config + global CSS

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Update `tailwind.config.ts`**

Replace the entire `colors` section:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        foreground: "var(--color-text)",
        primary: {
          DEFAULT: "#00C896",
          dark: "#009970",
          light: "#00E8AE",
        },
        secondary: {
          DEFAULT: "#F5A623",
          dark: "#D4891A",
          light: "#FFD166",
        },
        surface: {
          DEFAULT: "#1A2E4A",
          dark: "#0F1E30",
        },
        navy: "#080F1E",
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 2: Update `src/app/globals.css`**

Replace entire file content:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

:root {
  --color-bg: #080F1E;
  --color-surface: #1A2E4A;
  --color-primary: #00C896;
  --color-accent: #F5A623;
  --color-text: #F4F8FF;
}

body {
  color: var(--color-text);
  background: var(--color-bg);
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Glass utility classes */
@layer utilities {
  .glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 0.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
  }

  .glass-strong {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 0.5px solid rgba(255, 255, 255, 0.18);
    border-radius: 16px;
  }

  .glass-teal {
    background: rgba(0, 200, 150, 0.08);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 0.5px solid rgba(0, 200, 150, 0.25);
    border-radius: 16px;
  }

  .glow-teal {
    box-shadow: 0 0 24px rgba(0, 200, 150, 0.35);
  }

  .glow-gold {
    box-shadow: 0 0 24px rgba(245, 166, 35, 0.35);
  }

  .text-balance {
    text-wrap: balance;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-in;
  }

  .animate-slide-up {
    animation: slideUp 0.4s ease-out;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

html {
  scroll-behavior: smooth;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #0F1E30;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 200, 150, 0.4);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 200, 150, 0.7);
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

**Step 3: Verify no TypeScript errors**
```bash
npx tsc --noEmit
```

**Step 4: Commit**
```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: apply OpSale brand tokens — Space Navy, Teal Prime, Reward Gold, glass utilities"
```

---

## Task 5: OpSale Logo component

**Files:**
- Create: `src/components/ui/OpSaleLogo.tsx`

**Step 1: Create the component**
```tsx
// src/components/ui/OpSaleLogo.tsx
import Link from 'next/link';

interface OpSaleLogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function OpSaleLogo({ href = '/', size = 'md', showTagline = false }: OpSaleLogoProps) {
  const sizes = {
    sm: { mark: 36, markRadius: 9, font: 'text-xl', tagFont: 'text-[8px]' },
    md: { mark: 44, markRadius: 11, font: 'text-2xl', tagFont: 'text-[9px]' },
    lg: { mark: 56, markRadius: 14, font: 'text-4xl', tagFont: 'text-[10px]' },
  };
  const s = sizes[size];

  const logo = (
    <div className="flex items-center gap-3">
      {/* Mark */}
      <div
        className="flex items-center justify-center flex-shrink-0 glow-teal"
        style={{
          width: s.mark,
          height: s.mark,
          background: 'linear-gradient(135deg, #00C896, #009970)',
          borderRadius: s.markRadius,
        }}
      >
        <svg width={s.mark * 0.5} height={s.mark * 0.5} viewBox="0 0 28 28" fill="none">
          <rect x="3" y="3" width="9" height="9" rx="2.5" fill="#080F1E" />
          <rect x="16" y="3" width="9" height="9" rx="2.5" fill="#080F1E" opacity="0.55" />
          <rect x="3" y="16" width="9" height="9" rx="2.5" fill="#080F1E" opacity="0.55" />
          <circle cx="20.5" cy="20.5" r="4.5" fill="#F5A623" />
          <path d="M20.5 18v2.5l1.5 1.5" stroke="#080F1E" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wordmark */}
      <div>
        <div className={`font-display font-extrabold leading-none text-[#F4F8FF] tracking-tight ${s.font}`}>
          Op<span className="text-primary">Sale</span>
        </div>
        <div className={`uppercase tracking-[2.5px] text-[#F4F8FF]/35 mt-0.5 font-body ${s.tagFont}`}>
          Business Operating System
        </div>
        {showTagline && (
          <div className={`text-primary/80 tracking-wide font-body ${s.tagFont}`}>
            Sell. Retain. Grow.
          </div>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href} className="hover:opacity-90 transition-opacity">{logo}</Link> : logo;
}
```

**Step 2: Verify no TypeScript errors**
```bash
npx tsc --noEmit
```

**Step 3: Commit**
```bash
git add src/components/ui/OpSaleLogo.tsx
git commit -m "feat: add OpSale logo component with mark, wordmark and tagline variants"
```

---

## Task 6: Reskin — Auth pages (signin + signup)

**Files:**
- Modify: `src/app/(marketplace)/signin/page.tsx`
- Modify: `src/app/(marketplace)/signup/page.tsx`

**Step 1: Update signin page**

Replace the outer wrapper div and card styling in `signin/page.tsx`:

Find:
```tsx
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light/40 via-white to-primary/20 relative overflow-hidden">
  {/* Decorative background blobs */}
  <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
  <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

  <div className="w-full max-w-md p-8 relative z-[60]" style={{ isolation: 'isolate' }}>
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10 relative z-[60]">
      <div className="text-center mb-10">
        <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-dark to-primary-dark bg-clip-text text-transparent">
            Leeztruestyles
          </h1>
        </Link>
        <p className="mt-3 text-gray-600 font-medium tracking-wide">
          Welcome back
        </p>
      </div>
```

Replace with:
```tsx
<div className="min-h-screen flex items-center justify-center bg-navy relative overflow-hidden">
  {/* Atmospheric orbs */}
  <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full pointer-events-none" style={{ background: 'rgba(0,200,150,0.18)', filter: 'blur(60px)' }} />
  <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full pointer-events-none" style={{ background: 'rgba(245,166,35,0.12)', filter: 'blur(60px)' }} />

  <div className="w-full max-w-md px-4 py-8 relative z-10">
    <div className="glass-strong p-8 sm:p-10">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <OpSaleLogo size="md" showTagline />
        </div>
        <p className="mt-3 text-[#F4F8FF]/60 font-body tracking-wide">
          Welcome back
        </p>
      </div>
```

Add the import at the top of the file:
```tsx
import OpSaleLogo from '@/components/ui/OpSaleLogo';
```

Also replace all pink/white input and button styles in the file:
- `bg-white/50 focus:bg-white text-gray-900` → `bg-white/5 focus:bg-white/10 text-[#F4F8FF]`
- `border-gray-200` → `border-white/10`
- `focus:ring-primary/50 focus:border-primary/50` → `focus:ring-primary/40 focus:border-primary/40`
- `placeholder-gray-400` → `placeholder-[#F4F8FF]/30`
- `text-gray-700` (labels) → `text-[#F4F8FF]/70`
- `bg-primary hover:bg-primary-dark` (button) → `bg-primary hover:bg-primary-dark` (same — primary is now teal)
- `shadow-primary/30` → `shadow-primary/30` (same)
- `"New to Leeztruestyles?"` → `"New to OpSale?"`
- `text-secondary-dark hover:text-secondary` → `text-primary hover:text-primary-light`
- `bg-white/50 backdrop-blur` (divider span) → `bg-transparent`

**Step 2: Apply same pattern to signup page**

Open `src/app/(marketplace)/signup/page.tsx` and apply the same changes:
- Same Space Navy background + atmospheric orbs
- Same glass-strong card
- Replace `Leeztruestyles` with `OpSaleLogo` component
- Update all input, label, button colors as above

**Step 3: Run dev server and visually verify**
```bash
npm run dev
```
Visit `http://localhost:3000/signin` — should show dark glassmorphism card on Space Navy background with teal logo.

**Step 4: Commit**
```bash
git add src/app/(marketplace)/signin/page.tsx src/app/(marketplace)/signup/page.tsx
git commit -m "feat: reskin signin and signup pages to OpSale dark glassmorphism brand"
```

---

## Task 7: Reskin — Navbar

**Files:**
- Modify: find the navbar component (likely `src/components/navigation/Navbar.tsx` or similar)

**Step 1: Find the navbar**
```bash
find src/components/navigation -name "*.tsx" | head -10
```

**Step 2: Replace brand name / logo**

Find any `Leeztruestyles` text or image logo in the navbar and replace with `<OpSaleLogo size="sm" />`.

**Step 3: Update navbar background**

Replace light/white navbar background with:
```tsx
className="bg-navy/90 backdrop-blur-md border-b border-white/10"
```

**Step 4: Update nav link colors**

Replace `text-gray-*` link colors with `text-[#F4F8FF]/70 hover:text-[#F4F8FF]`.
Replace active states with `text-primary`.

**Step 5: Update CTA buttons in navbar** (cart icon, sign in links)

Replace pink/secondary button styles with `bg-primary hover:bg-primary-dark text-navy`.

**Step 6: Commit**
```bash
git add src/components/navigation/
git commit -m "feat: reskin navbar to OpSale brand — dark glass, teal accents"
```

---

## Task 8: Reskin — Footer

**Files:**
- Modify: `src/components/navigation/Footer.tsx`

**Step 1: Replace logo image with OpSaleLogo component**

Remove the `<Image src="/images/leeztruelogo.jpeg" ... />` block.
Add `import OpSaleLogo from '@/components/ui/OpSaleLogo'`.
Replace with `<OpSaleLogo size="sm" showTagline />`.

**Step 2: Update background and text colors**

Replace:
```tsx
className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-auto border-t border-gray-700"
```
With:
```tsx
className="bg-navy border-t border-white/10 text-[#F4F8FF] mt-auto"
```

Replace `text-gray-400 hover:text-primary` with `text-[#F4F8FF]/50 hover:text-primary`.
Replace tagline `"Your premier destination for fashion..."` with `"The operating system for modern sellers worldwide."`.

**Step 3: Commit**
```bash
git add src/components/navigation/Footer.tsx
git commit -m "feat: reskin footer to OpSale brand"
```

---

## Task 9: Reskin — Admin dashboard

**Files:**
- Modify: `src/app/(admin)/dashboard/page.tsx`
- Modify: `src/components/dashboard/` (all files)

**Step 1: Update dashboard layout background**

Find the dashboard layout or page wrapper. Replace any `bg-gray-*` or white backgrounds with `bg-navy`.
Replace sidebar/panel backgrounds with `bg-surface` or `glass` class.

**Step 2: Update all card/panel components in `src/components/dashboard/`**

For each file, replace:
- `bg-white` → `glass`
- `bg-gray-50` or `bg-gray-100` → `bg-surface`
- `text-gray-*` → `text-[#F4F8FF]` or `text-[#F4F8FF]/60`
- `border-gray-*` → `border-white/10`
- Pink/red accent colors → `text-primary` or `text-secondary` (teal/gold)

**Step 3: Update dashboard nav/sidebar**

Replace logo text with `<OpSaleLogo size="sm" />`.
Replace active nav item highlight from pink to `bg-primary/20 text-primary border-l-2 border-primary`.

**Step 4: Commit**
```bash
git add src/app/(admin)/ src/components/dashboard/
git commit -m "feat: reskin admin dashboard to OpSale dark glassmorphism"
```

---

## Task 10: Reskin — Loyalty pages (gold accent)

**Files:**
- Modify: `src/components/loyalty/` (all files)
- Modify: `src/app/(marketplace)/profile/rewards/` (all pages)

**Step 1: Apply gold accent to loyalty components**

For all files in `src/components/loyalty/`:
- Replace pink/primary colors on reward elements with `text-secondary` (gold `#F5A623`)
- Replace tier badge backgrounds with `glass-teal` for standard, gold gradient for Gold/Platinum
- Replace `bg-white` card backgrounds with `glass`
- Update `TierBadge.tsx` — Standard: teal, Silver: `#C0C0C0`, Gold: `#F5A623`, Platinum: `#E5E4E2`

**Step 2: Commit**
```bash
git add src/components/loyalty/ src/app/(marketplace)/profile/rewards/
git commit -m "feat: reskin loyalty pages to OpSale gold accent theme"
```

---

## Task 11: Reskin — Marketplace home page metadata

**Files:**
- Modify: `src/app/(marketplace)/home/page.tsx`

**Step 1: Update page metadata**

Replace:
```tsx
export const metadata: Metadata = {
  title: "Leeztruestyles - Fashion Marketplace in Kenya",
  description: "Discover the latest fashion trends at Leeztruestyles...",
  openGraph: {
    title: "Leeztruestyles - Fashion Marketplace in Kenya",
    description: "Discover the latest fashion trends at Leeztruestyles...",
    type: "website",
  },
};
```
With:
```tsx
export const metadata: Metadata = {
  title: "OpSale — Sell. Retain. Grow.",
  description: "The business operating system for modern sellers worldwide. Marketplace, loyalty, records, and admin — all in one subscription.",
  openGraph: {
    title: "OpSale — Sell. Retain. Grow.",
    description: "The business operating system for modern sellers worldwide.",
    type: "website",
  },
};
```

**Step 2: Commit**
```bash
git add src/app/(marketplace)/home/page.tsx
git commit -m "feat: update marketplace home metadata to OpSale brand"
```

---

## Task 12: Landing page — root page.tsx

**Files:**
- Modify: `src/app/page.tsx` (currently a redirect or placeholder)
- Create: `src/app/api/waitlist/route.ts`

**Step 1: Check what current `src/app/page.tsx` does**
```bash
cat src/app/page.tsx
```

**Step 2: Create the waitlist API route**

```typescript
// src/app/api/waitlist/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();
  const { full_name, email, business_name, category, team_size, country } = body;

  if (!full_name || !email || !business_name || !category || !team_size || !country) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const { error } = await supabase.from('waitlist').insert({
    full_name,
    email,
    business_name,
    category,
    team_size,
    country,
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This email is already on the waitlist.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to save. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 3: Build the landing page**

Replace `src/app/page.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import OpSaleLogo from '@/components/ui/OpSaleLogo';

const CATEGORIES = ['Retail', 'Fashion', 'Food & Beverage', 'Services', 'Other'];
const TEAM_SIZES = ['Solo', '2–5', '6–20', '20+'];

const PRICING = [
  {
    name: 'Starter',
    price: '$19',
    target: 'Solo sellers & early-stage businesses',
    features: ['Up to 50 products', '200 orders/mo', 'Basic records', 'Standard loyalty'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$49',
    target: 'Growing SMEs with teams',
    features: ['Unlimited products', '2,000 orders/mo', 'Full records', 'Advanced loyalty tiers', 'Staff accounts'],
    cta: 'Most Popular',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$99',
    target: 'Established retailers',
    features: ['Everything in Growth', 'Custom domain', 'Priority support', 'API access', 'White-glove onboarding'],
    cta: 'Go Pro',
    highlight: false,
  },
];

const PILLARS = [
  { icon: '📦', title: 'Record-first', desc: 'Every transaction tracked and searchable' },
  { icon: '⭐', title: 'Loyalty built-in', desc: 'Rewards that bring customers back' },
  { icon: '📊', title: 'Smart admin', desc: 'One dashboard, full visibility' },
  { icon: '🌍', title: 'Global-ready', desc: 'Built for sellers worldwide' },
];

export default function LandingPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', business_name: '',
    category: '', team_size: '', country: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (res.ok) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMsg(data.error || 'Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen bg-navy text-[#F4F8FF] font-body overflow-x-hidden">

      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full" style={{ background: 'rgba(0,200,150,0.12)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/3 right-[-60px] w-72 h-72 rounded-full" style={{ background: 'rgba(245,166,35,0.08)', filter: 'blur(70px)' }} />
        <div className="absolute bottom-[-60px] left-1/3 w-64 h-64 rounded-full" style={{ background: 'rgba(0,120,255,0.07)', filter: 'blur(60px)' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <OpSaleLogo size="md" showTagline />
        <a href="#get-started" className="bg-primary hover:bg-primary-dark text-navy font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
          Get Your Store
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 glass-teal px-4 py-1.5 rounded-full text-sm text-primary mb-6">
          <span>✓</span> Now accepting early businesses
        </div>
        <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-tight tracking-tight mb-6">
          Your store.<br />
          <span className="text-primary">Your rules.</span><br />
          One platform.
        </h1>
        <p className="text-[#F4F8FF]/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          OpSale is the business operating system for modern sellers. Marketplace, customer loyalty, automated records, and smart admin — all under one subscription.
        </p>
        <a href="#get-started" className="inline-block bg-primary hover:bg-primary-dark text-navy font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:-translate-y-0.5 glow-teal">
          Get Your Store →
        </a>
        <p className="text-[#F4F8FF]/35 text-sm mt-4">We set it up with you. No tech skills needed.</p>
      </section>

      {/* Brand pillars */}
      <section className="relative z-10 px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PILLARS.map(p => (
            <div key={p.title} className="glass p-5 hover:border-primary/30 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="text-primary font-semibold text-sm mb-1">{p.title}</div>
              <div className="text-[#F4F8FF]/50 text-xs leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem section */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center">
        <p className="text-[#F4F8FF]/35 uppercase tracking-[2.5px] text-xs mb-4">The Problem</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl mb-8">
          Running a business shouldn't mean<br />
          <span className="text-primary">juggling 5 different apps.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {[
            { problem: 'Record chaos', solution: 'Every transaction logged automatically. Search anything instantly.' },
            { problem: 'Zero retention', solution: 'Built-in loyalty rewards that keep customers coming back on autopilot.' },
            { problem: 'Blind admin', solution: 'Real-time dashboard — sales, inventory, staff, and customers in one view.' },
          ].map(item => (
            <div key={item.problem} className="glass p-6">
              <div className="text-[#F4F8FF]/40 line-through text-sm mb-2">{item.problem}</div>
              <div className="text-[#F4F8FF]/80 text-sm leading-relaxed">{item.solution}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <p className="text-[#F4F8FF]/35 uppercase tracking-[2.5px] text-xs text-center mb-4">Pricing</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-12">Simple, transparent plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING.map(plan => (
            <div key={plan.name} className={`${plan.highlight ? 'glass-strong border-primary/30' : 'glass'} p-7 relative`} style={plan.highlight ? { borderColor: 'rgba(0,200,150,0.3)' } : {}}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-navy text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="text-[#F4F8FF]/50 text-sm mb-1">{plan.name}</div>
              <div className="font-display font-extrabold text-4xl text-[#F4F8FF] mb-1">{plan.price}<span className="text-lg text-[#F4F8FF]/40">/mo</span></div>
              <div className="text-[#F4F8FF]/40 text-xs mb-6">{plan.target}</div>
              <ul className="space-y-2 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#F4F8FF]/70">
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="#get-started" className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${plan.highlight ? 'bg-primary hover:bg-primary-dark text-navy' : 'glass-teal text-primary hover:bg-primary/20'}`}>
                Get Started
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-[#F4F8FF]/30 text-sm mt-6">Enterprise? <a href="#get-started" className="text-primary underline">Contact us</a> for custom pricing.</p>
      </section>

      {/* Interest form */}
      <section id="get-started" className="relative z-10 px-6 py-20 max-w-2xl mx-auto">
        <p className="text-[#F4F8FF]/35 uppercase tracking-[2.5px] text-xs text-center mb-4">Get Started</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-4">Register your business</h2>
        <p className="text-[#F4F8FF]/50 text-center mb-10">Fill in the form and we'll reach out within 24 hours to set up your store together.</p>

        {status === 'success' ? (
          <div className="glass-teal p-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="font-display font-bold text-xl text-primary mb-2">You're on the list!</h3>
            <p className="text-[#F4F8FF]/60">We'll reach out to <strong>{form.email}</strong> within 24 hours to get your store set up.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-strong p-8 space-y-5">
            {[
              { label: 'Full name', name: 'full_name', type: 'text', placeholder: 'Jane Doe' },
              { label: 'Email address', name: 'email', type: 'email', placeholder: 'jane@example.com' },
              { label: 'Business name', name: 'business_name', type: 'text', placeholder: 'My Awesome Store' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-xs text-[#F4F8FF]/50 uppercase tracking-wider mb-2">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  required
                  placeholder={field.placeholder}
                  value={(form as any)[field.name]}
                  onChange={e => setForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#F4F8FF] placeholder-[#F4F8FF]/25 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-colors text-sm"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs text-[#F4F8FF]/50 uppercase tracking-wider mb-2">Business category</label>
              <select
                required
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-navy border border-white/10 rounded-xl px-4 py-3 text-[#F4F8FF] focus:outline-none focus:border-primary/50 transition-colors text-sm"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#F4F8FF]/50 uppercase tracking-wider mb-2">Team size</label>
              <div className="grid grid-cols-4 gap-2">
                {TEAM_SIZES.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, team_size: size }))}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.team_size === size ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-[#F4F8FF]/60 hover:border-white/20'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#F4F8FF]/50 uppercase tracking-wider mb-2">Country</label>
              <input
                type="text"
                name="country"
                required
                placeholder="e.g. Kenya, UK, Philippines"
                value={form.country}
                onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#F4F8FF] placeholder-[#F4F8FF]/25 focus:outline-none focus:border-primary/50 transition-colors text-sm"
              />
            </div>

            {status === 'error' && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-3">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-primary hover:bg-primary-dark text-navy font-bold py-4 rounded-xl transition-all hover:-translate-y-0.5 glow-teal disabled:opacity-50 disabled:hover:translate-y-0 text-base"
            >
              {status === 'loading' ? 'Registering...' : 'Register My Business →'}
            </button>
            <p className="text-center text-[#F4F8FF]/30 text-xs">We'll contact you within 24 hours. No spam, ever.</p>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10 text-center">
        <div className="flex justify-center mb-4">
          <OpSaleLogo size="sm" showTagline />
        </div>
        <p className="text-[#F4F8FF]/30 text-sm">© 2026 OpSale. All rights reserved.</p>
      </footer>
    </div>
  );
}
```

**Step 4: Run dev server and verify**
```bash
npm run dev
```
Visit `http://localhost:3000` — should show full OpSale landing page with hero, pillars, pricing, and interest form.
Submit the form and verify entry appears in Supabase `waitlist` table.

**Step 5: Commit**
```bash
git add src/app/page.tsx src/app/api/waitlist/route.ts
git commit -m "feat: build OpSale landing page with interest form and waitlist API"
```

---

## Task 13: Final cleanup and push

**Step 1: Search for remaining Leeztruestyles references**
```bash
grep -r "Leeztruestyles\|leeztruestyles\|leez" src/ --include="*.tsx" --include="*.ts" -l
```

**Step 2: Replace each occurrence** with the appropriate OpSale equivalent (logo component, metadata, or remove).

**Step 3: Update `next.config.js` app name if set**
```bash
cat next.config.js | grep -i "leez\|name"
```

**Step 4: Update `README.md`**

Replace contents with:
```markdown
# OpSale — Business Operating System

Sell. Retain. Grow.

Built with Next.js 14, Supabase, Tailwind CSS, and Paystack.

## Stack
- Next.js 14 (App Router, TypeScript)
- Supabase (PostgreSQL + Auth)
- Tailwind CSS
- Paystack (payments)

## Run locally
\`\`\`bash
npm install
npm run dev
\`\`\`
```

**Step 5: Final build check**
```bash
npm run build
```
Expected: Build completes with no errors.

**Step 6: Push everything to OpSale repo**
```bash
git push origin main
```

**Step 7: Update Vercel project** (if deployed)
- Go to Vercel → project settings → update environment variables to new Supabase project
- Trigger redeploy

---

## Success Checklist

- [ ] Code pushed to `github.com/DennisBundi/opsale.git`
- [ ] Supabase migrated, app runs against new project
- [ ] `waitlist` table created in new Supabase project
- [ ] Brand tokens applied (Space Navy, Teal Prime, Reward Gold, glass utilities)
- [ ] `OpSaleLogo` component used everywhere (no Leeztruestyles name visible)
- [ ] Auth pages dark glassmorphism
- [ ] Admin dashboard dark glass panels
- [ ] Landing page live at `/` with hero, pricing, and interest form
- [ ] Form submissions save to `waitlist` table
- [ ] `npm run build` passes with no errors
- [ ] Zero `Leeztruestyles` references in source code
