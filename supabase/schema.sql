-- MKT-FTI Phase 1 — Supabase schema
-- Run in the Supabase SQL Editor on a new project (Dashboard → SQL → New query).
--
-- Notes:
-- • Primary keys are UUID (default gen_random_uuid()).
-- • RLS is disabled for MVP testing — enable + policies before production.
-- • Client code should pass UUID strings or omit id to use the default.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared: auto-update updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Suppliers (matches types/supplier.ts → Supplier)
-- ---------------------------------------------------------------------------

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  factory_name text not null,
  display_name text not null default '',
  country text not null default 'China',
  province_region text not null default '',
  city_district text not null default '',
  full_address text not null default '',
  location_note text not null default '',
  website text not null default '',
  alibaba_link text not null default '',
  main_product_category text not null default '',
  image_url text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suppliers_updated_at_idx
  on public.suppliers (updated_at desc);

-- ---------------------------------------------------------------------------
-- Supplier contacts (matches types/supplier.ts → SupplierContact)
-- ---------------------------------------------------------------------------

create table if not exists public.supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  contact_name text not null,
  position text not null default '',
  sales_rep_code text not null default '',
  wechat_id text not null default '',
  whatsapp text not null default '',
  phone text not null default '',
  email text not null default '',
  line text not null default '',
  image_url text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_contacts_supplier_id_idx
  on public.supplier_contacts (supplier_id);

create index if not exists supplier_contacts_primary_idx
  on public.supplier_contacts (supplier_id, is_primary)
  where is_primary = true;

-- ---------------------------------------------------------------------------
-- Products (matches types/product.ts → Product + workflow fields)
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null default '',
  brand text not null default '',
  supplier_id uuid references public.suppliers (id) on delete set null,
  supplier text not null default '',
  factory_location text not null default '',
  category text not null default '',
  description text not null default '',
  opportunity_score integer not null default 0,
  latest_note text not null default '',
  business_type text not null default '',
  oem_type text not null default 'OEM',
  factory_contact text not null default '',
  product_system text not null default '',
  packaging_notes text not null default '',
  margin_target numeric not null default 0,
  annual_volume_target integer not null default 0,
  image_url text,
  image_alt text not null default '',
  brand_strategy jsonb not null default '{}'::jsonb,
  custom_options jsonb not null default '{}'::jsonb,
  certification jsonb not null default '{}'::jsonb,
  status text not null default 'interested',
  pipeline_stage text not null default 'interested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_supplier_id_idx
  on public.products (supplier_id);

create index if not exists products_status_idx
  on public.products (status);

create index if not exists products_pipeline_stage_idx
  on public.products (pipeline_stage);

create index if not exists products_updated_at_idx
  on public.products (updated_at desc);

-- ---------------------------------------------------------------------------
-- Product MOQ prices (matches types/product.ts → ProductPriceOption)
-- ---------------------------------------------------------------------------

create table if not exists public.product_moq_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  moq integer not null,
  label text,
  usd_cost numeric not null default 0,
  exchange_rate numeric not null default 36,
  wholesale_gp numeric not null default 0.42,
  dealer_gp numeric not null default 0.14,
  lead_time text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_moq_prices_product_id_idx
  on public.product_moq_prices (product_id);

create index if not exists product_moq_prices_moq_idx
  on public.product_moq_prices (product_id, moq);

-- ---------------------------------------------------------------------------
-- Product scorecards (matches types/product.ts → ProductEvaluationScorecard)
-- ---------------------------------------------------------------------------

create table if not exists public.product_scorecards (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  criteria jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz,
  evaluator text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id)
);

create index if not exists product_scorecards_product_id_idx
  on public.product_scorecards (product_id);

-- ---------------------------------------------------------------------------
-- Product ideas (matches types/idea.ts → ProductIdea)
-- ---------------------------------------------------------------------------

create table if not exists public.product_ideas (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  source_link text not null default '',
  source_platform text not null default 'other',
  image_url text,
  why_interesting text not null default '',
  possible_brand text not null default '',
  estimated_price_range text not null default '',
  tags text[] not null default '{}',
  status text not null default 'interested',
  converted_product_id uuid references public.products (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_ideas_status_idx
  on public.product_ideas (status);

create index if not exists product_ideas_updated_at_idx
  on public.product_ideas (updated_at desc);

-- ---------------------------------------------------------------------------
-- Simulator (matches lib/pricing.ts → ScenarioRow)
-- ---------------------------------------------------------------------------

create table if not exists public.simulator_scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Untitled scenario',
  product_id uuid references public.products (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simulator_scenario_items (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.simulator_scenarios (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  product_name text not null default '',
  moq_tier_id uuid references public.product_moq_prices (id) on delete set null,
  moq integer not null default 0,
  qty integer not null default 0,
  selling_price numeric not null default 0,
  unit_cost numeric not null default 0,
  target_revenue numeric not null default 0,
  revenue numeric not null default 0,
  total_cost numeric not null default 0,
  gross_profit numeric not null default 0,
  gross_profit_percent numeric not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists simulator_scenario_items_scenario_id_idx
  on public.simulator_scenario_items (scenario_id);

create index if not exists simulator_scenario_items_sort_idx
  on public.simulator_scenario_items (scenario_id, sort_order);

-- ---------------------------------------------------------------------------
-- Pipeline logs (matches types/product.ts → PipelineLog)
-- ---------------------------------------------------------------------------

create table if not exists public.pipeline_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pipeline_logs_product_id_idx
  on public.pipeline_logs (product_id);

create index if not exists pipeline_logs_updated_at_idx
  on public.pipeline_logs (updated_at desc);

-- ---------------------------------------------------------------------------
-- Notes (matches types/product.ts → ProductNote)
-- ---------------------------------------------------------------------------

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  type text not null default 'rich',
  title text not null default '',
  body text not null default '',
  author text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_product_id_idx
  on public.notes (product_id);

create index if not exists notes_updated_at_idx
  on public.notes (updated_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'suppliers',
    'supplier_contacts',
    'products',
    'product_moq_prices',
    'product_scorecards',
    'product_ideas',
    'simulator_scenarios',
    'simulator_scenario_items',
    'pipeline_logs',
    'notes'
  ]
  loop
    execute format('
      drop trigger if exists set_%s_updated_at on public.%s;
      create trigger set_%s_updated_at
        before update on public.%s
        for each row execute function public.set_updated_at();
    ', t, t, t, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security — disabled for MVP testing
-- ---------------------------------------------------------------------------

alter table public.suppliers disable row level security;
alter table public.supplier_contacts disable row level security;
alter table public.products disable row level security;
alter table public.product_moq_prices disable row level security;
alter table public.product_scorecards disable row level security;
alter table public.product_ideas disable row level security;
alter table public.simulator_scenarios disable row level security;
alter table public.simulator_scenario_items disable row level security;
alter table public.pipeline_logs disable row level security;
alter table public.notes disable row level security;

-- Optional: open policies instead of disabling RLS (uncomment if preferred)
--
-- alter table public.suppliers enable row level security;
-- create policy "mvp_all_suppliers" on public.suppliers for all using (true) with check (true);
-- … repeat for each table …
