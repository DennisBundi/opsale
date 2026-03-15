# OpSale — Business Operating System

> Sell. Retain. Grow.

OpSale is a multi-tenant SaaS platform for modern sellers worldwide. Built on Next.js 14 + Supabase.

## Features

- **Marketplace** — Product listings, cart, checkout, order management
- **Loyalty & Rewards** — Points system, tiers (Standard/Silver/Gold/Platinum), referrals
- **Record Keeping** — Automated transaction logs, order history, customer profiles
- **Admin Dashboard** — Real-time analytics, inventory, staff management, POS

## Tech Stack

- **Frontend:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + glassmorphism design system
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Payments:** Paystack
- **Hosting:** Vercel

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase + Paystack credentials.

## Architecture

Multi-tenant: every table scoped by `tenant_id`. Row Level Security enforces isolation.
Subdomain routing: `[slug].opsale.app` → tenant storefront (coming soon).
