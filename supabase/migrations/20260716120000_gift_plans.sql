-- Customer Gift Plans module — schema, communication views, access control.
-- Apply manually via Supabase SQL editor or CLI. Do not auto-apply from the app.
--
-- Access model: MKT HQ / Admin only (app session + Server Actions).
-- Sales teams receive exported Communication Reports — no in-app login.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'gift_plan_status') then
    create type public.gift_plan_status as enum (
      'draft',
      'review',
      'approved',
      'preparing',
      'completed'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'gift_item_category') then
    create type public.gift_item_category as enum (
      'gift_voucher',
      'premium_gift',
      'certificate',
      'product',
      'sales_gift',
      'executive_gift',
      'other'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'gift_item_source') then
    create type public.gift_item_source as enum (
      'marketing',
      'sales',
      'executive',
      'fti_stock',
      'external_purchase',
      'other'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.gift_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  campaign_year integer not null,
  campaign_headline text not null default '',
  description text not null default '',
  owner text not null default '',
  status public.gift_plan_status not null default 'draft',
  total_customer_sales numeric(18, 2) not null default 0,
  max_actual_cost_budget numeric(18, 2),
  budget_limit_percent numeric(8, 4),
  campaign_conditions text not null default '',
  approval_notes text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_saved_at timestamptz not null default now(),
  created_by_email text,
  updated_by_email text,
  constraint gift_plans_campaign_year_chk
    check (campaign_year >= 2000 and campaign_year <= 2100),
  constraint gift_plans_total_customer_sales_chk
    check (total_customer_sales >= 0),
  constraint gift_plans_max_actual_cost_budget_chk
    check (max_actual_cost_budget is null or max_actual_cost_budget >= 0),
  constraint gift_plans_budget_limit_percent_chk
    check (budget_limit_percent is null or budget_limit_percent >= 0)
);

create table if not exists public.gift_plan_purchase_groups (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.gift_plans (id) on delete cascade,
  label text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gift_plan_tiers (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.gift_plans (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  sales_threshold numeric(18, 2),
  sales_threshold_label text not null default '',
  customer_count integer not null default 0,
  notes text not null default '',
  gift_policy text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gift_plan_tiers_customer_count_chk
    check (customer_count >= 0)
);

create table if not exists public.gift_plan_items (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.gift_plan_tiers (id) on delete cascade,
  sort_order integer not null default 0,
  gift_name text not null,
  category public.gift_item_category not null default 'other',
  source public.gift_item_source not null default 'other',
  qty_per_customer numeric(12, 4) not null default 0,
  unit_actual_cost numeric(18, 2) not null default 0,
  estimated_gift_value_per_unit numeric(18, 2) not null default 0,
  supplier text,
  notes text,
  purchase_group_id uuid references public.gift_plan_purchase_groups (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gift_plan_items_qty_per_customer_chk
    check (qty_per_customer >= 0),
  constraint gift_plan_items_unit_actual_cost_chk
    check (unit_actual_cost >= 0),
  constraint gift_plan_items_estimated_gift_value_per_unit_chk
    check (estimated_gift_value_per_unit >= 0)
);

-- Case-insensitive, trimmed unique tier name within a plan.
create unique index if not exists gift_plan_tiers_plan_name_ci_uq
  on public.gift_plan_tiers (plan_id, lower(btrim(name)));

create index if not exists gift_plans_status_idx
  on public.gift_plans (status)
  where is_archived = false;

create index if not exists gift_plans_archived_idx
  on public.gift_plans (is_archived);

create index if not exists gift_plans_year_idx
  on public.gift_plans (campaign_year);

create index if not exists gift_plans_updated_idx
  on public.gift_plans (updated_at desc);

create index if not exists gift_plan_purchase_groups_plan_id_idx
  on public.gift_plan_purchase_groups (plan_id);

create index if not exists gift_plan_tiers_plan_id_idx
  on public.gift_plan_tiers (plan_id);

create index if not exists gift_plan_tiers_plan_sort_idx
  on public.gift_plan_tiers (plan_id, sort_order);

create index if not exists gift_plan_items_tier_id_idx
  on public.gift_plan_items (tier_id);

create index if not exists gift_plan_items_tier_sort_idx
  on public.gift_plan_items (tier_id, sort_order);

create index if not exists gift_plan_items_purchase_group_idx
  on public.gift_plan_items (purchase_group_id)
  where purchase_group_id is not null;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists gift_plans_set_updated_at on public.gift_plans;
create trigger gift_plans_set_updated_at
  before update on public.gift_plans
  for each row execute function public.set_updated_at();

drop trigger if exists gift_plan_purchase_groups_set_updated_at on public.gift_plan_purchase_groups;
create trigger gift_plan_purchase_groups_set_updated_at
  before update on public.gift_plan_purchase_groups
  for each row execute function public.set_updated_at();

drop trigger if exists gift_plan_tiers_set_updated_at on public.gift_plan_tiers;
create trigger gift_plan_tiers_set_updated_at
  before update on public.gift_plan_tiers
  for each row execute function public.set_updated_at();

drop trigger if exists gift_plan_items_set_updated_at on public.gift_plan_items;
create trigger gift_plan_items_set_updated_at
  before update on public.gift_plan_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Communication report views (public-facing export boundary — no internal cost)
-- Used by Server Actions when building Sales Communication exports only.
-- ---------------------------------------------------------------------------

create or replace view public.gift_plans_communication_v
with (security_barrier = true)
as
select
  id,
  name,
  campaign_year,
  campaign_headline,
  description,
  campaign_conditions,
  status,
  is_archived,
  updated_at,
  last_saved_at
from public.gift_plans;

create or replace view public.gift_plan_tiers_communication_v
with (security_barrier = true)
as
select
  id,
  plan_id,
  name,
  sort_order,
  sales_threshold,
  sales_threshold_label,
  customer_count,
  notes,
  gift_policy,
  created_at,
  updated_at
from public.gift_plan_tiers;

create or replace view public.gift_plan_items_communication_v
with (security_barrier = true)
as
select
  id,
  tier_id,
  sort_order,
  gift_name,
  category,
  source,
  qty_per_customer,
  estimated_gift_value_per_unit,
  notes,
  created_at,
  updated_at
from public.gift_plan_items;

comment on view public.gift_plans_communication_v is
  'Public communication export boundary — excludes budget, approval notes, and cost fields.';

comment on view public.gift_plan_items_communication_v is
  'Public communication items — excludes unit_actual_cost, supplier, purchase_group_id.';

-- ---------------------------------------------------------------------------
-- Row Level Security — enabled without policies in this migration.
-- Apply 20260716140000_gift_plans_rls_corrective.sql next for:
--   gift_catalog table, gift_plan_items snapshot columns, policies + grants.
-- ---------------------------------------------------------------------------

alter table public.gift_plans enable row level security;
alter table public.gift_plan_purchase_groups enable row level security;
alter table public.gift_plan_tiers enable row level security;
alter table public.gift_plan_items enable row level security;

notify pgrst, 'reload schema';
