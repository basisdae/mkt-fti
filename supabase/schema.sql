-- MKT-FTI Phase 1 schema
-- Run in Supabase SQL Editor after creating a project.

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------

create table if not exists public.suppliers (
  id text primary key,
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

create table if not exists public.supplier_contacts (
  id text primary key,
  supplier_id text not null references public.suppliers (id) on delete cascade,
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

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id text primary key,
  name text not null,
  code text not null default '',
  brand text not null default '',
  supplier_id text references public.suppliers (id) on delete set null,
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

create index if not exists products_supplier_id_idx on public.products (supplier_id);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_pipeline_stage_idx on public.products (pipeline_stage);

create table if not exists public.product_moq_prices (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
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

create table if not exists public.product_scorecards (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
  criteria jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz,
  evaluator text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id)
);

-- ---------------------------------------------------------------------------
-- Ideas
-- ---------------------------------------------------------------------------

create table if not exists public.product_ideas (
  id text primary key,
  product_name text not null,
  source_link text not null default '',
  source_platform text not null default 'other',
  image_url text,
  why_interesting text not null default '',
  possible_brand text not null default '',
  estimated_price_range text not null default '',
  tags text[] not null default '{}',
  status text not null default 'interested',
  converted_product_id text references public.products (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Simulator
-- ---------------------------------------------------------------------------

create table if not exists public.simulator_scenarios (
  id text primary key,
  name text not null default 'Untitled scenario',
  product_id text references public.products (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simulator_scenario_items (
  id text primary key,
  scenario_id text not null references public.simulator_scenarios (id) on delete cascade,
  product_id text not null,
  product_name text not null default '',
  moq_tier_id text not null default '',
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

-- ---------------------------------------------------------------------------
-- Pipeline & notes
-- ---------------------------------------------------------------------------

create table if not exists public.pipeline_logs (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
  action text not null,
  detail text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists pipeline_logs_product_id_idx
  on public.pipeline_logs (product_id);

create table if not exists public.notes (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
  type text not null default 'rich',
  title text not null default '',
  body text not null default '',
  author text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_product_id_idx on public.notes (product_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
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
-- Row Level Security (permissive for Phase 1 — tighten when auth lands)
-- ---------------------------------------------------------------------------

alter table public.suppliers enable row level security;
alter table public.supplier_contacts enable row level security;
alter table public.products enable row level security;
alter table public.product_moq_prices enable row level security;
alter table public.product_scorecards enable row level security;
alter table public.product_ideas enable row level security;
alter table public.simulator_scenarios enable row level security;
alter table public.simulator_scenario_items enable row level security;
alter table public.pipeline_logs enable row level security;
alter table public.notes enable row level security;

create policy "phase1_public_all_suppliers"
  on public.suppliers for all using (true) with check (true);

create policy "phase1_public_all_supplier_contacts"
  on public.supplier_contacts for all using (true) with check (true);

create policy "phase1_public_all_products"
  on public.products for all using (true) with check (true);

create policy "phase1_public_all_product_moq_prices"
  on public.product_moq_prices for all using (true) with check (true);

create policy "phase1_public_all_product_scorecards"
  on public.product_scorecards for all using (true) with check (true);

create policy "phase1_public_all_product_ideas"
  on public.product_ideas for all using (true) with check (true);

create policy "phase1_public_all_simulator_scenarios"
  on public.simulator_scenarios for all using (true) with check (true);

create policy "phase1_public_all_simulator_scenario_items"
  on public.simulator_scenario_items for all using (true) with check (true);

create policy "phase1_public_all_pipeline_logs"
  on public.pipeline_logs for all using (true) with check (true);

create policy "phase1_public_all_notes"
  on public.notes for all using (true) with check (true);
