# Importation Waitlist Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an importation waitlist feature — a vibrant home page section, anonymous sign-up modal, admin management dashboard, and retailer status check page.

**Architecture:** Anonymous submissions stored in a new `import_waitlist` Supabase table. Three public API routes handle submit/status-check. One admin-only route handles list + approve/reject. Role system extended with `importation` section gated to admin/manager.

**Tech Stack:** Next.js App Router, Supabase (server client + admin client), Jest, TypeScript, Tailwind CSS

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260311_import_waitlist.sql`

**Step 1: Write the migration SQL**

```sql
-- Create import_waitlist table
create table if not exists public.import_waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  business_name text not null,
  goods_category text not null,
  monthly_order_value text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now()
);

-- Index for email lookups (status check page)
create index if not exists import_waitlist_email_idx on public.import_waitlist (email);

-- RLS: enable row level security
alter table public.import_waitlist enable row level security;

-- Allow anonymous inserts (waitlist sign-up requires no auth)
create policy "Allow public insert on import_waitlist"
  on public.import_waitlist for insert
  to anon, authenticated
  with check (true);

-- Only service role can select/update (admin uses service role via createAdminClient)
-- No select/update policies needed for anon/authenticated — admin client bypasses RLS
```

**Step 2: Run migration**

```bash
npx supabase db push
```

Expected: migration applied with no errors.

**Step 3: Verify table exists in Supabase dashboard**

Check the `import_waitlist` table appears in the Table Editor with all columns.

**Step 4: Commit**

```bash
git add supabase/migrations/20260311_import_waitlist.sql
git commit -m "feat: add import_waitlist database migration"
```

---

## Task 2: Extend Role System for Importation Section

**Files:**
- Modify: `src/lib/auth/roles.ts`
- Modify: `tests/lib/auth/roles.test.ts`

**Step 1: Write failing test**

Add to `tests/lib/auth/roles.test.ts`:

```typescript
describe('canAccessSection - importation', () => {
  it('should allow admin to access importation section', () => {
    const { canAccessSection } = require('@/lib/auth/roles');
    expect(canAccessSection('admin', 'importation')).toBe(true);
  });

  it('should allow manager to access importation section', () => {
    const { canAccessSection } = require('@/lib/auth/roles');
    expect(canAccessSection('manager', 'importation')).toBe(true);
  });

  it('should deny seller access to importation section', () => {
    const { canAccessSection } = require('@/lib/auth/roles');
    expect(canAccessSection('seller', 'importation')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/lib/auth/roles.test.ts --no-coverage
```

Expected: FAIL — `importation` not a valid DashboardSection

**Step 3: Update roles.ts**

In `src/lib/auth/roles.ts`, change line 58:

```typescript
// Before
export type DashboardSection = 'dashboard' | 'products' | 'orders' | 'inventory' | 'employees' | 'payments' | 'pos' | 'profile' | 'settings' | 'reviews' | 'loyalty';

// After
export type DashboardSection = 'dashboard' | 'products' | 'orders' | 'inventory' | 'employees' | 'payments' | 'pos' | 'profile' | 'settings' | 'reviews' | 'loyalty' | 'importation';
```

In `canAccessSection`, add before the final `return false`:

```typescript
// Admin and manager only for importation
if (section === 'importation') {
  return userRole === 'admin' || userRole === 'manager';
}
```

In `getAllowedSections`, update the `allSections` array to include `'importation'`:

```typescript
const allSections: DashboardSection[] = ['dashboard', 'products', 'orders', 'inventory', 'employees', 'payments', 'pos', 'profile', 'settings', 'reviews', 'loyalty', 'importation'];
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/lib/auth/roles.test.ts --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/auth/roles.ts tests/lib/auth/roles.test.ts
git commit -m "feat: add importation section to role system"
```

---

## Task 3: API — Submit Waitlist Application (Public POST)

**Files:**
- Create: `src/app/api/importation/waitlist/route.ts`
- Create: `tests/api/importation/waitlist.test.ts`

**Step 1: Write failing test**

Create `tests/api/importation/waitlist.test.ts`:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockAdminClient = {
  from: jest.fn(() => mockAdminClient),
  insert: jest.fn(() => mockAdminClient),
  select: jest.fn(() => mockAdminClient),
  single: jest.fn(),
};

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => mockAdminClient),
}));

const validBody = {
  full_name: 'Jane Wanjiku',
  email: 'jane@retailer.co.ke',
  phone: '0712345678',
  business_name: 'Wanjiku Styles',
  goods_category: 'Clothing',
  monthly_order_value: 'KES 50k–100k',
};

describe('POST /api/importation/waitlist', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 201 on valid submission', async () => {
    mockAdminClient.single.mockResolvedValueOnce({
      data: { id: 'abc-123', ...validBody, status: 'pending' },
      error: null,
    });

    const { POST } = await import('@/app/api/importation/waitlist/route');
    const req = new NextRequest('http://localhost/api/importation/waitlist', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.email).toBe('jane@retailer.co.ke');
  });

  it('should return 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/importation/waitlist/route');
    const req = new NextRequest('http://localhost/api/importation/waitlist', {
      method: 'POST',
      body: JSON.stringify({ full_name: 'Jane' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/api/importation/waitlist.test.ts --no-coverage
```

Expected: FAIL — module not found

**Step 3: Create the route**

Create `src/app/api/importation/waitlist/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const REQUIRED_FIELDS = [
  "full_name",
  "email",
  "phone",
  "business_name",
  "goods_category",
  "monthly_order_value",
] as const;

const VALID_CATEGORIES = ["Clothing", "Footwear", "Accessories", "Home Goods", "Electronics", "Other"];
const VALID_ORDER_VALUES = ["Under KES 50k", "KES 50k–100k", "KES 100k–500k", "Over KES 500k"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
        return NextResponse.json(
          { error: `Missing or invalid field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (!VALID_CATEGORIES.includes(body.goods_category)) {
      return NextResponse.json({ error: "Invalid goods_category" }, { status: 400 });
    }

    if (!VALID_ORDER_VALUES.includes(body.monthly_order_value)) {
      return NextResponse.json({ error: "Invalid monthly_order_value" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("import_waitlist")
      .insert({
        full_name: body.full_name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        business_name: body.business_name.trim(),
        goods_category: body.goods_category,
        monthly_order_value: body.monthly_order_value,
      })
      .select()
      .single();

    if (error) {
      console.error("Waitlist insert error:", error);
      return NextResponse.json({ error: "Failed to save application." }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Waitlist route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/api/importation/waitlist.test.ts --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/importation/waitlist/route.ts tests/api/importation/waitlist.test.ts
git commit -m "feat: add importation waitlist submit API route"
```

---

## Task 4: API — Check Application Status (Public GET)

**Files:**
- Create: `src/app/api/importation/status/route.ts`
- Create: `tests/api/importation/status.test.ts`

**Step 1: Write failing test**

Create `tests/api/importation/status.test.ts`:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockAdminClient = {
  from: jest.fn(() => mockAdminClient),
  select: jest.fn(() => mockAdminClient),
  eq: jest.fn(() => mockAdminClient),
  order: jest.fn(() => mockAdminClient),
  limit: jest.fn(() => mockAdminClient),
  single: jest.fn(),
};

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => mockAdminClient),
}));

describe('GET /api/importation/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when email is missing', async () => {
    const { GET } = await import('@/app/api/importation/status/route');
    const req = new NextRequest('http://localhost/api/importation/status');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 404 when email not found', async () => {
    mockAdminClient.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    const { GET } = await import('@/app/api/importation/status/route');
    const req = new NextRequest('http://localhost/api/importation/status?email=unknown@test.com');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('should return application status when found', async () => {
    mockAdminClient.single.mockResolvedValueOnce({
      data: { id: 'abc', email: 'jane@retailer.co.ke', status: 'pending', admin_note: null },
      error: null,
    });
    const { GET } = await import('@/app/api/importation/status/route');
    const req = new NextRequest('http://localhost/api/importation/status?email=jane@retailer.co.ke');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('pending');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest tests/api/importation/status.test.ts --no-coverage
```

Expected: FAIL — module not found

**Step 3: Create the route**

Create `src/app/api/importation/status/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("import_waitlist")
      .select("id, email, status, admin_note, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "No application found with this email." }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest tests/api/importation/status.test.ts --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/importation/status/route.ts tests/api/importation/status.test.ts
git commit -m "feat: add importation status check API route"
```

---

## Task 5: API — Admin List & Update Applications

**Files:**
- Create: `src/app/api/importation/admin/route.ts`

**Step 1: Create the route**

Create `src/app/api/importation/admin/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) return null;
  const role = await getUserRole(user.id);
  if (role !== "admin" && role !== "manager") return null;
  return user;
}

// GET: list all applications with optional filters
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const admin = createAdminClient();

  // Stats
  const [totalRes, pendingRes, approvedRes] = await Promise.all([
    admin.from("import_waitlist").select("*", { count: "exact", head: true }),
    admin.from("import_waitlist").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("import_waitlist").select("*", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  const stats = {
    total: totalRes.count || 0,
    pending: pendingRes.count || 0,
    approved: approvedRes.count || 0,
  };

  let query = admin
    .from("import_waitlist")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (category && category !== "all") query = query.eq("goods_category", category);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to fetch applications." }, { status: 500 });
  }

  return NextResponse.json({ data, stats });
}

// PATCH: update status and optional note for one application
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, status, admin_note } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }

  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("import_waitlist")
    .update({ status, admin_note: admin_note || null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update application." }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

**Step 2: Commit**

```bash
git add src/app/api/importation/admin/route.ts
git commit -m "feat: add importation admin API route (list + update)"
```

---

## Task 6: Home Page — Importation Section Component

**Files:**
- Create: `src/components/home/ImportationSection.tsx`

**Step 1: Create the component**

Create `src/components/home/ImportationSection.tsx`:

```tsx
"use client";

import { useState } from "react";
import WaitlistModal from "@/components/home/WaitlistModal";

export default function ImportationSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="relative bg-gradient-to-br from-navy-900 via-indigo-900 to-slate-900 text-white py-16 md:py-24 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      {/* Decorative blurred circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #4f46e5, transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-4 py-2 rounded-full mb-6 text-sm font-semibold tracking-wide">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              EARLY ACCESS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Source Directly
              <br />
              <span className="text-indigo-400">from China</span>
            </h2>
            <p className="text-white/75 text-lg mb-8 max-w-lg leading-relaxed">
              Are you a Kenyan retailer? Get connected with verified Chinese
              suppliers. Join our waitlist and be among the first to access
              direct importation at competitive prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-indigo-500/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Join the Waitlist
              </button>
              <a
                href="/importation/status"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
              >
                Check my status
              </a>
            </div>
          </div>

          {/* Right: SVG trade route illustration */}
          <div className="flex items-center justify-center animate-fade-in">
            <TradeRouteIllustration />
          </div>
        </div>
      </div>

      {modalOpen && <WaitlistModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}

function TradeRouteIllustration() {
  return (
    <svg viewBox="0 0 400 260" className="w-full max-w-md" aria-label="Kenya to China trade route">
      {/* Background glow */}
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <filter id="blur">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <ellipse cx="200" cy="130" rx="180" ry="110" fill="url(#glow)" />

      {/* Dotted trade arc */}
      <path
        d="M 80 180 Q 200 30 320 180"
        fill="none"
        stroke="#818cf8"
        strokeWidth="2"
        strokeDasharray="8 6"
        opacity="0.7"
      />

      {/* Arrow at end of arc */}
      <polygon points="316,172 326,182 308,186" fill="#818cf8" opacity="0.7" />

      {/* Kenya node */}
      <circle cx="80" cy="180" r="28" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="2" />
      <text x="80" y="175" textAnchor="middle" fontSize="20">🇰🇪</text>
      <text x="80" y="220" textAnchor="middle" fontSize="11" fill="#93c5fd" fontWeight="600">KENYA</text>

      {/* China node */}
      <circle cx="320" cy="180" r="28" fill="#3b1f1f" stroke="#f87171" strokeWidth="2" />
      <text x="320" y="175" textAnchor="middle" fontSize="20">🇨🇳</text>
      <text x="320" y="220" textAnchor="middle" fontSize="11" fill="#fca5a5" fontWeight="600">CHINA</text>

      {/* Shipping box in the middle */}
      <g transform="translate(176, 72)">
        <rect x="0" y="8" width="48" height="38" rx="4" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" />
        <rect x="0" y="8" width="48" height="14" rx="4" fill="#3730a3" stroke="#818cf8" strokeWidth="1.5" />
        <line x1="24" y1="8" x2="24" y2="46" stroke="#818cf8" strokeWidth="1" opacity="0.5" />
        <line x1="10" y1="8" x2="14" y2="22" stroke="#818cf8" strokeWidth="1" opacity="0.5" />
        <line x1="38" y1="8" x2="34" y2="22" stroke="#818cf8" strokeWidth="1" opacity="0.5" />
        <text x="24" y="38" textAnchor="middle" fontSize="14">📦</text>
      </g>

      {/* Floating sparkles */}
      <circle cx="150" cy="90" r="2" fill="#a5b4fc" opacity="0.8" />
      <circle cx="260" cy="80" r="2" fill="#a5b4fc" opacity="0.6" />
      <circle cx="200" cy="55" r="1.5" fill="#c7d2fe" opacity="0.7" />
    </svg>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/home/ImportationSection.tsx
git commit -m "feat: add ImportationSection home page component with trade route visual"
```

---

## Task 7: Waitlist Modal Component

**Files:**
- Create: `src/components/home/WaitlistModal.tsx`

**Step 1: Create the component**

Create `src/components/home/WaitlistModal.tsx`:

```tsx
"use client";

import { useState } from "react";

const GOODS_CATEGORIES = ["Clothing", "Footwear", "Accessories", "Home Goods", "Electronics", "Other"];
const ORDER_VALUE_RANGES = ["Under KES 50k", "KES 50k–100k", "KES 100k–500k", "Over KES 500k"];

interface Props {
  onClose: () => void;
}

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  goods_category: string;
  monthly_order_value: string;
};

export default function WaitlistModal({ onClose }: Props) {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    business_name: "",
    goods_category: "",
    monthly_order_value: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/importation/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-lg rounded-none shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">Join the Waitlist</h2>
            <p className="text-indigo-300 text-sm mt-1">Connect your business with Chinese suppliers</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          /* Success state */
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">You're on the list!</h3>
            <p className="text-gray-600 mb-2">
              We've received your application for <strong>{form.business_name}</strong>.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              You can check your application status anytime at{" "}
              <a href="/importation/status" className="text-indigo-600 underline">
                leeztruestyles.com/importation/status
              </a>{" "}
              using <strong>{form.email}</strong>.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Jane Wanjiku"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={form.business_name}
                  onChange={(e) => update("business_name", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Wanjiku Styles"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="jane@business.co.ke"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0712 345 678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goods Category *</label>
              <select
                required
                value={form.goods_category}
                onChange={(e) => update("goods_category", e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select a category</option>
                {GOODS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Monthly Order Value *</label>
              <select
                required
                value={form.monthly_order_value}
                onChange={(e) => update("monthly_order_value", e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select a range</option>
                {ORDER_VALUE_RANGES.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting…" : "Join Waitlist"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/home/WaitlistModal.tsx
git commit -m "feat: add WaitlistModal component for importation waitlist sign-up"
```

---

## Task 8: Add Importation Section to Home Page

**Files:**
- Modify: `src/app/(marketplace)/home/page.tsx`

**Step 1: Add the import**

In `src/app/(marketplace)/home/page.tsx`, add after the existing imports:

```typescript
import ImportationSection from "@/components/home/ImportationSection";
```

**Step 2: Add the section**

Inside the return JSX, add `<ImportationSection />` between the "Featured Products" section (`</section>` closing the featured products) and `<ReviewSection />`:

```tsx
      {/* Importation Waitlist Section */}
      <ImportationSection />

      {/* Customer Reviews Section */}
      <ReviewSection />
```

**Step 3: Start dev server and verify visually**

```bash
npm run dev
```

Open http://localhost:3000 and scroll down to confirm the importation section appears between Featured Products and Reviews with the trade route illustration, and clicking "Join the Waitlist" opens the modal.

**Step 4: Commit**

```bash
git add src/app/(marketplace)/home/page.tsx
git commit -m "feat: add ImportationSection to home page"
```

---

## Task 9: Retailer Status Check Page

**Files:**
- Create: `src/app/(marketplace)/importation/status/page.tsx`

**Step 1: Create the page**

Create `src/app/(marketplace)/importation/status/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "pending" | "approved" | "rejected";

interface ApplicationResult {
  status: Status;
  admin_note: string | null;
  email: string;
  created_at: string;
}

const STATUS_CONFIG: Record<Status, { color: string; bg: string; icon: string; title: string; message: string }> = {
  pending: {
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: "⏳",
    title: "Under Review",
    message: "Your application is under review. We'll be in touch soon.",
  },
  approved: {
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: "✅",
    title: "Approved!",
    message: "Congratulations! Your application has been approved. Expect a call from our team shortly.",
  },
  rejected: {
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: "❌",
    title: "Not Approved",
    message: "Thank you for your interest. Unfortunately we can't onboard you at this time.",
  },
};

export default function ImportationStatusPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setNotFound(false);
    setError(null);

    try {
      const res = await fetch(`/api/importation/status?email=${encodeURIComponent(email.trim())}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }
      const json = await res.json();
      setResult(json.data);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-bold text-gray-900">Leeztruestyles</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Application Status</h1>
          <p className="text-gray-600">Enter your email to see your importation waitlist status.</p>
        </div>

        <div className="bg-white shadow-lg p-8">
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="your@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {loading ? "Checking…" : "Check Status"}
            </button>
          </form>

          {/* Results */}
          {notFound && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 text-center">
              <p className="text-gray-600 text-sm">No application found with this email. Please check and try again.</p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {result && (() => {
            const config = STATUS_CONFIG[result.status];
            return (
              <div className={`mt-6 p-5 border ${config.bg}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${config.color}`}>{config.title}</h3>
                    <p className={`text-sm mt-1 ${config.color} opacity-90`}>{config.message}</p>
                    {result.admin_note && (
                      <p className="text-sm mt-3 text-gray-600 italic border-t border-current/20 pt-2">
                        Note: {result.admin_note}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-3">
                      Applied: {new Date(result.created_at).toLocaleDateString("en-KE", { dateStyle: "long" })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Haven't applied yet?{" "}
          <Link href="/" className="text-indigo-600 underline">
            Join the waitlist on our home page
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Verify the page loads**

```bash
npm run dev
```

Open http://localhost:3000/importation/status and confirm the form renders.

**Step 3: Commit**

```bash
git add src/app/(marketplace)/importation/status/page.tsx
git commit -m "feat: add retailer importation status check page"
```

---

## Task 10: Admin Dashboard — Importation Management Page

**Files:**
- Create: `src/app/(admin)/dashboard/importation/page.tsx`
- Create: `src/components/admin/ImportationAdmin.tsx`

**Step 1: Create the ImportationAdmin component**

Create `src/components/admin/ImportationAdmin.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";

const GOODS_CATEGORIES = ["Clothing", "Footwear", "Accessories", "Home Goods", "Electronics", "Other"];

type Status = "pending" | "approved" | "rejected";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  goods_category: string;
  monthly_order_value: string;
  status: Status;
  admin_note: string | null;
  created_at: string;
}

interface Stats { total: number; pending: number; approved: number }

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function ImportationAdmin() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [pendingAction, setPendingAction] = useState<{ id: string; status: Status } | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);

    const res = await fetch(`/api/importation/admin?${params}`);
    if (res.ok) {
      const json = await res.json();
      setApplications(json.data || []);
      setStats(json.stats || { total: 0, pending: 0, approved: 0 });
    }
    setLoading(false);
  }, [statusFilter, categoryFilter]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  async function handleUpdateStatus(id: string, status: Status, note: string) {
    const res = await fetch("/api/importation/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, admin_note: note }),
    });

    if (res.ok) {
      setApplications((prev) =>
        prev.map((app) => app.id === id ? { ...app, status, admin_note: note || null } : app)
      );
      setStats((prev) => {
        const app = applications.find((a) => a.id === id);
        const oldStatus = app?.status;
        const newStats = { ...prev };
        if (oldStatus === "pending") newStats.pending = Math.max(0, newStats.pending - 1);
        if (status === "approved") newStats.approved = newStats.approved + (oldStatus === "approved" ? 0 : 1);
        if (oldStatus === "approved" && status !== "approved") newStats.approved = Math.max(0, newStats.approved - 1);
        return newStats;
      });
    }
    setActionId(null);
    setPendingAction(null);
    setNoteInput("");
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Applications", value: stats.total, color: "text-gray-900" },
          { label: "Pending Review", value: stats.pending, color: "text-amber-600" },
          { label: "Approved", value: stats.approved, color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          {GOODS_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading applications…</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Business", "Contact", "Category", "Monthly Value", "Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((app) => (
                  <>
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{app.business_name}</p>
                        <p className="text-gray-500 text-xs">{app.full_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{app.email}</p>
                        <p className="text-gray-500 text-xs">{app.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                          {app.goods_category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{app.monthly_order_value}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(app.created_at).toLocaleDateString("en-KE")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_STYLES[app.status]}`}>
                          {app.status}
                        </span>
                        {app.admin_note && (
                          <p className="text-xs text-gray-400 mt-1 max-w-[150px] truncate" title={app.admin_note}>
                            {app.admin_note}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {app.status !== "approved" && (
                            <button
                              onClick={() => { setActionId(app.id); setPendingAction({ id: app.id, status: "approved" }); setNoteInput(""); }}
                              className="px-3 py-1 bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {app.status !== "rejected" && (
                            <button
                              onClick={() => { setActionId(app.id); setPendingAction({ id: app.id, status: "rejected" }); setNoteInput(""); }}
                              className="px-3 py-1 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Inline confirmation panel */}
                    {actionId === app.id && pendingAction && (
                      <tr key={`${app.id}-action`} className="bg-indigo-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-medium text-gray-700">
                              {pendingAction.status === "approved" ? "Approve" : "Reject"} <strong>{app.business_name}</strong>?
                            </span>
                            <input
                              type="text"
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              placeholder="Optional note to retailer…"
                              className="border border-gray-300 px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => handleUpdateStatus(pendingAction.id, pendingAction.status, noteInput)}
                              className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => { setActionId(null); setPendingAction(null); }}
                              className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create the page**

Create `src/app/(admin)/dashboard/importation/page.tsx`:

```tsx
import ImportationAdmin from "@/components/admin/ImportationAdmin";

export default function ImportationPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Importation Waitlist</h1>
        <p className="text-gray-600 mt-1">
          Review and approve retailer applications to connect with Chinese suppliers.
        </p>
      </div>
      <ImportationAdmin />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/admin/ImportationAdmin.tsx src/app/(admin)/dashboard/importation/page.tsx
git commit -m "feat: add importation admin dashboard page with approve/reject"
```

---

## Task 11: Add Importation to Admin Navigation

**Files:**
- Modify: `src/components/admin/AdminNav.tsx`

**Step 1: Find the navItems array**

In `src/components/admin/AdminNav.tsx`, the `allNavItems` array starts around line 125. Locate this block.

**Step 2: Add the importation nav item**

Add after the `loyalty` item (line 132) and before the separator/profile items:

```typescript
{ href: '/dashboard/importation', label: 'Importation', icon: '🌏', section: 'importation' as const },
```

**Step 3: Verify the nav renders**

```bash
npm run dev
```

Log in as admin and confirm "Importation 🌏" appears in the sidebar. Clicking it should load the importation page.

**Step 4: Commit**

```bash
git add src/components/admin/AdminNav.tsx
git commit -m "feat: add Importation nav item to admin sidebar"
```

---

## Task 12: Final Verification

**Step 1: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: All tests pass including the new importation tests.

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 3: End-to-end manual test**

1. Open http://localhost:3000 — scroll to Importation section, confirm visual
2. Click "Join the Waitlist" — confirm modal opens
3. Fill in the form and submit — confirm success message with email reference
4. Open http://localhost:3000/importation/status — enter the email used above
5. Confirm application shows as "Pending"
6. Open http://localhost:3000/dashboard/importation — confirm application appears
7. Approve the application with a note
8. Go back to /importation/status — confirm status is now "Approved" with note

**Step 4: Final commit if any cleanup needed**

```bash
git add -p
git commit -m "fix: address any issues found during final verification"
```
