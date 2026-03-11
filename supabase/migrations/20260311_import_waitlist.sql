-- Create import_waitlist table
create table if not exists public.import_waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  business_name text not null,
  goods_category text not null,
  monthly_order_value text not null check (monthly_order_value in ('Under KES 50k', 'KES 50k–100k', 'KES 100k–500k', 'Over KES 500k')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now()
);

-- Index for email lookups (status check page)
create index if not exists import_waitlist_email_idx on public.import_waitlist (email);

-- RLS: enable row level security
alter table public.import_waitlist enable row level security;

-- Allow anonymous inserts (waitlist sign-up requires no auth)
create policy if not exists "Allow public insert on import_waitlist"
  on public.import_waitlist for insert
  to anon, authenticated
  with check (true);
