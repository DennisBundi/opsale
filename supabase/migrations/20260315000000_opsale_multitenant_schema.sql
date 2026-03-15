-- ============================================================
-- OpSale Multi-Tenant Schema
-- Every table has tenant_id. RLS isolates tenants from each other.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TENANTS (businesses that signed up)
-- ============================================================
create table if not exists tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null, -- used for subdomain: slug.opsale.app
  owner_id uuid references auth.users(id) on delete set null,
  category text,
  country text,
  plan text default 'starter' check (plan in ('starter', 'growth', 'pro', 'enterprise')),
  plan_status text default 'trial' check (plan_status in ('trial', 'active', 'past_due', 'cancelled')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- WAITLIST (landing page signups, before tenant provisioning)
-- ============================================================
create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null unique,
  business_name text not null,
  category text not null,
  team_size text not null,
  country text not null,
  status text default 'pending' check (status in ('pending', 'contacted', 'onboarded', 'declined')),
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- STAFF / MEMBERS (employees per tenant)
-- ============================================================
create table if not exists tenant_members (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'staff' check (role in ('owner', 'admin', 'staff', 'viewer')),
  created_at timestamptz default now(),
  unique (tenant_id, user_id)
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  created_at timestamptz default now(),
  unique (tenant_id, slug)
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price decimal(12,2) not null default 0,
  compare_at_price decimal(12,2),
  sku text,
  images jsonb default '[]',
  tags text[],
  is_active boolean default true,
  has_variants boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PRODUCT VARIANTS (size, colour, etc.)
-- ============================================================
create table if not exists product_variants (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  name text not null, -- e.g. "Red / XL"
  sku text,
  price decimal(12,2),
  attributes jsonb default '{}', -- {color: "Red", size: "XL"}
  created_at timestamptz default now()
);

-- ============================================================
-- INVENTORY
-- ============================================================
create table if not exists inventory (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  variant_id uuid references product_variants(id) on delete cascade,
  stock_quantity integer not null default 0,
  reserved_quantity integer not null default 0,
  low_stock_threshold integer default 5,
  updated_at timestamptz default now(),
  unique (tenant_id, product_id, variant_id)
);

-- ============================================================
-- CUSTOMERS (end-customers per tenant, separate from staff)
-- ============================================================
create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  full_name text,
  phone text,
  address jsonb default '{}',
  notes text,
  created_at timestamptz default now(),
  unique (tenant_id, email)
);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  order_number text not null,
  status text default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal decimal(12,2) not null default 0,
  discount_amount decimal(12,2) default 0,
  tax_amount decimal(12,2) default 0,
  total decimal(12,2) not null default 0,
  currency text default 'USD',
  payment_status text default 'unpaid' check (payment_status in ('unpaid','paid','partially_paid','refunded')),
  payment_method text,
  payment_reference text,
  shipping_address jsonb default '{}',
  notes text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, order_number)
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists order_items (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  quantity integer not null default 1,
  unit_price decimal(12,2) not null,
  total_price decimal(12,2) not null,
  created_at timestamptz default now()
);

-- ============================================================
-- LOYALTY — PROGRAM CONFIG PER TENANT
-- ============================================================
create table if not exists loyalty_programs (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null unique,
  points_per_currency_unit decimal(8,2) default 1, -- e.g. 1 point per $1 spent
  redemption_rate decimal(8,4) default 0.01, -- e.g. 1 point = $0.01
  is_active boolean default true,
  tiers jsonb default '[
    {"name":"Standard","min_points":0,"color":"#00C896"},
    {"name":"Silver","min_points":500,"color":"#C0C0C0"},
    {"name":"Gold","min_points":2000,"color":"#F5A623"},
    {"name":"Platinum","min_points":5000,"color":"#E5E4E2"}
  ]',
  created_at timestamptz default now()
);

-- ============================================================
-- LOYALTY — CUSTOMER POINTS LEDGER
-- ============================================================
create table if not exists loyalty_points (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  balance integer not null default 0,
  lifetime_earned integer not null default 0,
  tier text default 'Standard',
  updated_at timestamptz default now(),
  unique (tenant_id, customer_id)
);

-- ============================================================
-- LOYALTY — TRANSACTIONS (earn/redeem history)
-- ============================================================
create table if not exists loyalty_transactions (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  order_id uuid references orders(id) on delete set null,
  type text not null check (type in ('earn','redeem','adjust','expire')),
  points integer not null,
  description text,
  created_at timestamptz default now()
);

-- ============================================================
-- REVIEWS
-- ============================================================
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  is_approved boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- TENANT SETTINGS (store config)
-- ============================================================
create table if not exists tenant_settings (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null unique,
  store_name text,
  store_description text,
  logo_url text,
  banner_url text,
  currency text default 'USD',
  timezone text default 'UTC',
  social_links jsonb default '{}',
  payment_config jsonb default '{}', -- paystack/stripe keys per tenant
  notification_email text,
  updated_at timestamptz default now()
);

-- ============================================================
-- IMPORTATION REQUESTS (existing feature)
-- ============================================================
create table if not exists importation_requests (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  description text not null,
  estimated_value decimal(12,2),
  status text default 'pending' check (status in ('pending','quoted','approved','in_transit','delivered','cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper function: get current user's tenant_id
create or replace function get_tenant_id()
returns uuid
language sql stable
as $$
  select tenant_id from tenant_members
  where user_id = auth.uid()
  limit 1;
$$;

-- Enable RLS on all tables
alter table tenants enable row level security;
alter table waitlist enable row level security;
alter table tenant_members enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table inventory enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table loyalty_programs enable row level security;
alter table loyalty_points enable row level security;
alter table loyalty_transactions enable row level security;
alter table reviews enable row level security;
alter table tenant_settings enable row level security;
alter table importation_requests enable row level security;

-- TENANTS: owner can see their own tenant
create policy "Tenant members can view their tenant"
  on tenants for select
  using (id = get_tenant_id());

-- WAITLIST: public insert, service role reads
create policy "Anyone can join waitlist"
  on waitlist for insert with check (true);

-- TENANT_MEMBERS: members can see their own memberships
create policy "Members can view memberships"
  on tenant_members for select
  using (tenant_id = get_tenant_id());

-- Generic tenant-scoped policies for all other tables
-- (select, insert, update, delete scoped to tenant_id)
do $$
declare
  t text;
  tables text[] := array[
    'categories','products','product_variants','inventory',
    'customers','orders','order_items','loyalty_programs',
    'loyalty_points','loyalty_transactions','reviews',
    'tenant_settings','importation_requests'
  ];
begin
  foreach t in array tables loop
    execute format('
      create policy "Tenant isolation: select" on %I for select
      using (tenant_id = get_tenant_id());
      create policy "Tenant isolation: insert" on %I for insert
      with check (tenant_id = get_tenant_id());
      create policy "Tenant isolation: update" on %I for update
      using (tenant_id = get_tenant_id());
      create policy "Tenant isolation: delete" on %I for delete
      using (tenant_id = get_tenant_id());
    ', t, t, t, t);
  end loop;
end;
$$;

-- Public can read approved reviews and active products (for storefront)
create policy "Public can read active products"
  on products for select
  using (is_active = true);

create policy "Public can read approved reviews"
  on reviews for select
  using (is_approved = true);

-- Public can insert customers (signup on storefront)
create policy "Public can create customer account"
  on customers for insert
  with check (true);
