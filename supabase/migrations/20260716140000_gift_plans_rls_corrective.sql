-- Gift Plans + Gift Catalog — additive schema + RLS corrective migration
-- Apply manually in Supabase SQL Editor. Do NOT auto-apply from the app.
--
-- Prerequisites:
--   - 20260716120000_gift_plans.sql already applied (tables exist; data preserved)
--   - public.app_users table exists
--   - Authenticated Supabase session via signInWithPassword (standard auth; no JWT secret)
--
-- This migration is ADDITIVE + CORRECTIVE only:
--   - Does NOT drop gift plan tables or delete existing rows
--   - Adds public.gift_catalog
--   - Adds snapshot/reference columns on gift_plan_items
--   - Enables RLS + policies on gift plan tables AND gift_catalog
--   - Recreates communication views with security_invoker
--   - Does NOT touch products, suppliers, sales plans, customers, or pricing

-- ===========================================================================
-- PART A — Gift Catalog (คลังของพรีเมียมและของแจก)
-- ===========================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'gift_catalog_status') then
    create type public.gift_catalog_status as enum (
      'active',
      'inactive',
      'archived'
    );
  end if;
end $$;

create table if not exists public.gift_catalog (
  id uuid primary key default gen_random_uuid(),
  gift_name text not null,
  internal_code text,
  category public.gift_item_category not null default 'other',
  source public.gift_item_source not null default 'other',
  description text not null default '',
  image_url text,
  unit text not null default 'piece',
  default_actual_cost numeric(18, 2) not null default 0,
  default_estimated_gift_value numeric(18, 2) not null default 0,
  supplier_name text,
  specification text not null default '',
  notes text not null default '',
  status public.gift_catalog_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_email text,
  updated_by_email text,
  constraint gift_catalog_gift_name_chk
    check (char_length(btrim(gift_name)) > 0),
  constraint gift_catalog_default_actual_cost_chk
    check (default_actual_cost >= 0),
  constraint gift_catalog_default_estimated_gift_value_chk
    check (default_estimated_gift_value >= 0)
);

comment on table public.gift_catalog is
  'Standalone premium/gift item library for Gift Plans. Not linked to products, suppliers, pricing, or inventory.';

comment on column public.gift_catalog.internal_code is
  'Optional internal SKU/code; unique when provided.';

comment on column public.gift_catalog.image_url is
  'Optional image URL or storage path; display only, no product FK.';

comment on column public.gift_catalog.supplier_name is
  'Free-text supplier label for purchasing reference; not a supplier master FK.';

-- Case-insensitive unique internal code when set.
create unique index if not exists gift_catalog_internal_code_ci_uq
  on public.gift_catalog (lower(btrim(internal_code)))
  where internal_code is not null and btrim(internal_code) <> '';

create index if not exists gift_catalog_status_idx
  on public.gift_catalog (status);

create index if not exists gift_catalog_active_name_idx
  on public.gift_catalog (lower(btrim(gift_name)))
  where status = 'active';

create index if not exists gift_catalog_category_idx
  on public.gift_catalog (category);

create index if not exists gift_catalog_source_idx
  on public.gift_catalog (source);

create index if not exists gift_catalog_updated_idx
  on public.gift_catalog (updated_at desc);

drop trigger if exists gift_catalog_set_updated_at on public.gift_catalog;
create trigger gift_catalog_set_updated_at
  before update on public.gift_catalog
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- gift_plan_items — catalog reference + specification snapshot column
-- Existing columns (gift_name, category, source, costs, supplier, notes)
-- remain the authoritative per-plan snapshot; catalog edits never propagate.
-- ---------------------------------------------------------------------------

alter table public.gift_plan_items
  add column if not exists gift_catalog_id uuid;

alter table public.gift_plan_items
  add column if not exists specification text not null default '';

comment on column public.gift_plan_items.gift_catalog_id is
  'Optional lineage to gift_catalog. ON DELETE RESTRICT blocks hard-delete of in-use catalog rows.';

comment on column public.gift_plan_items.specification is
  'Per-plan snapshot of variant/specification at time of save; independent of catalog.';

-- Add FK only when column exists without constraint (idempotent for re-run).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gift_plan_items_gift_catalog_id_fkey'
      and conrelid = 'public.gift_plan_items'::regclass
  ) then
    alter table public.gift_plan_items
      add constraint gift_plan_items_gift_catalog_id_fkey
      foreign key (gift_catalog_id)
      references public.gift_catalog (id)
      on delete restrict;
  end if;
end $$;

create index if not exists gift_plan_items_gift_catalog_id_idx
  on public.gift_plan_items (gift_catalog_id)
  where gift_catalog_id is not null;

-- Helper: whether a catalog row is referenced by any saved plan item.
create or replace function public.gift_catalog_is_in_use(p_catalog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.gift_plan_items i
    where i.gift_catalog_id = p_catalog_id
  );
$$;

revoke all on function public.gift_catalog_is_in_use(uuid) from public;
grant execute on function public.gift_catalog_is_in_use(uuid) to authenticated;

-- ===========================================================================
-- PART B — Auth helpers (reuse gift_plans permissions for gift_catalog)
-- ===========================================================================

create or replace function public.gift_plan_jwt_email()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select lower(trim(coalesce(
    auth.jwt() ->> 'email',
    auth.jwt() -> 'user_metadata' ->> 'email',
    ''
  )));
$$;

create or replace function public.gift_plan_current_user()
returns table (
  email text,
  role text,
  permissions jsonb,
  is_active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(u.email),
    u.role,
    u.permissions,
    u.is_active
  from public.app_users u
  where lower(u.email) = public.gift_plan_jwt_email()
  limit 1;
$$;

revoke all on function public.gift_plan_current_user() from public;
grant execute on function public.gift_plan_current_user() to authenticated;

create or replace function public.gift_plan_can_view()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select * into rec from public.gift_plan_current_user();
  if not found or rec.is_active is not true then
    return false;
  end if;

  if rec.role = 'admin' then
    return true;
  end if;

  if rec.role = 'mkt_hq' then
    return rec.permissions ? 'gift_plans.view'
      or rec.permissions ? 'gift_plans.edit'
      or rec.permissions ? 'gift_plans.export';
  end if;

  return false;
end;
$$;

revoke all on function public.gift_plan_can_view() from public;
grant execute on function public.gift_plan_can_view() to authenticated;

create or replace function public.gift_plan_can_edit()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select * into rec from public.gift_plan_current_user();
  if not found or rec.is_active is not true then
    return false;
  end if;

  if rec.role = 'admin' then
    return true;
  end if;

  if rec.role = 'mkt_hq' then
    return rec.permissions ? 'gift_plans.edit';
  end if;

  return false;
end;
$$;

revoke all on function public.gift_plan_can_edit() from public;
grant execute on function public.gift_plan_can_edit() to authenticated;

-- ===========================================================================
-- PART C — Communication views (security_invoker; no RLS bypass)
-- ===========================================================================

drop view if exists public.gift_plan_items_communication_v;
drop view if exists public.gift_plan_tiers_communication_v;
drop view if exists public.gift_plans_communication_v;

create view public.gift_plans_communication_v
with (security_invoker = true)
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

create view public.gift_plan_tiers_communication_v
with (security_invoker = true)
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

create view public.gift_plan_items_communication_v
with (security_invoker = true)
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
  'Communication export boundary — security_invoker; caller must pass gift_plan_can_view().';

comment on view public.gift_plan_items_communication_v is
  'Communication items — excludes unit_actual_cost, supplier, specification, purchase_group_id, gift_catalog_id.';

-- ===========================================================================
-- PART D — Grants: revoke anon; authenticated gated by RLS
-- ===========================================================================

revoke all on table public.gift_plans from anon;
revoke all on table public.gift_plan_purchase_groups from anon;
revoke all on table public.gift_plan_tiers from anon;
revoke all on table public.gift_plan_items from anon;
revoke all on table public.gift_catalog from anon;

revoke all on public.gift_plans_communication_v from anon;
revoke all on public.gift_plan_tiers_communication_v from anon;
revoke all on public.gift_plan_items_communication_v from anon;

grant select, insert, update, delete on table public.gift_plans to authenticated;
grant select, insert, update, delete on table public.gift_plan_purchase_groups to authenticated;
grant select, insert, update, delete on table public.gift_plan_tiers to authenticated;
grant select, insert, update, delete on table public.gift_plan_items to authenticated;
grant select, insert, update, delete on table public.gift_catalog to authenticated;

grant select on public.gift_plans_communication_v to authenticated;
grant select on public.gift_plan_tiers_communication_v to authenticated;
grant select on public.gift_plan_items_communication_v to authenticated;

-- ===========================================================================
-- PART E — Row Level Security (5 tables; no permissive catch-all policies)
-- ===========================================================================

alter table public.gift_plans enable row level security;
alter table public.gift_plan_purchase_groups enable row level security;
alter table public.gift_plan_tiers enable row level security;
alter table public.gift_plan_items enable row level security;
alter table public.gift_catalog enable row level security;

-- gift_plans
drop policy if exists gift_plans_select_authorized on public.gift_plans;
create policy gift_plans_select_authorized
  on public.gift_plans for select to authenticated
  using (public.gift_plan_can_view());

drop policy if exists gift_plans_insert_authorized on public.gift_plans;
create policy gift_plans_insert_authorized
  on public.gift_plans for insert to authenticated
  with check (public.gift_plan_can_edit());

drop policy if exists gift_plans_update_authorized on public.gift_plans;
create policy gift_plans_update_authorized
  on public.gift_plans for update to authenticated
  using (public.gift_plan_can_edit())
  with check (public.gift_plan_can_edit());

drop policy if exists gift_plans_delete_authorized on public.gift_plans;
create policy gift_plans_delete_authorized
  on public.gift_plans for delete to authenticated
  using (public.gift_plan_can_edit());

-- gift_plan_purchase_groups
drop policy if exists gift_plan_purchase_groups_select on public.gift_plan_purchase_groups;
create policy gift_plan_purchase_groups_select
  on public.gift_plan_purchase_groups for select to authenticated
  using (public.gift_plan_can_view());

drop policy if exists gift_plan_purchase_groups_insert on public.gift_plan_purchase_groups;
create policy gift_plan_purchase_groups_insert
  on public.gift_plan_purchase_groups for insert to authenticated
  with check (public.gift_plan_can_edit());

drop policy if exists gift_plan_purchase_groups_update on public.gift_plan_purchase_groups;
create policy gift_plan_purchase_groups_update
  on public.gift_plan_purchase_groups for update to authenticated
  using (public.gift_plan_can_edit())
  with check (public.gift_plan_can_edit());

drop policy if exists gift_plan_purchase_groups_delete on public.gift_plan_purchase_groups;
create policy gift_plan_purchase_groups_delete
  on public.gift_plan_purchase_groups for delete to authenticated
  using (public.gift_plan_can_edit());

-- gift_plan_tiers
drop policy if exists gift_plan_tiers_select on public.gift_plan_tiers;
create policy gift_plan_tiers_select
  on public.gift_plan_tiers for select to authenticated
  using (public.gift_plan_can_view());

drop policy if exists gift_plan_tiers_insert on public.gift_plan_tiers;
create policy gift_plan_tiers_insert
  on public.gift_plan_tiers for insert to authenticated
  with check (public.gift_plan_can_edit());

drop policy if exists gift_plan_tiers_update on public.gift_plan_tiers;
create policy gift_plan_tiers_update
  on public.gift_plan_tiers for update to authenticated
  using (public.gift_plan_can_edit())
  with check (public.gift_plan_can_edit());

drop policy if exists gift_plan_tiers_delete on public.gift_plan_tiers;
create policy gift_plan_tiers_delete
  on public.gift_plan_tiers for delete to authenticated
  using (public.gift_plan_can_edit());

-- gift_plan_items
drop policy if exists gift_plan_items_select on public.gift_plan_items;
create policy gift_plan_items_select
  on public.gift_plan_items for select to authenticated
  using (public.gift_plan_can_view());

drop policy if exists gift_plan_items_insert on public.gift_plan_items;
create policy gift_plan_items_insert
  on public.gift_plan_items for insert to authenticated
  with check (public.gift_plan_can_edit());

drop policy if exists gift_plan_items_update on public.gift_plan_items;
create policy gift_plan_items_update
  on public.gift_plan_items for update to authenticated
  using (public.gift_plan_can_edit())
  with check (public.gift_plan_can_edit());

drop policy if exists gift_plan_items_delete on public.gift_plan_items;
create policy gift_plan_items_delete
  on public.gift_plan_items for delete to authenticated
  using (public.gift_plan_can_edit());

-- gift_catalog (same permission helpers as Gift Plans)
drop policy if exists gift_catalog_select_authorized on public.gift_catalog;
create policy gift_catalog_select_authorized
  on public.gift_catalog for select to authenticated
  using (public.gift_plan_can_view());

drop policy if exists gift_catalog_insert_authorized on public.gift_catalog;
create policy gift_catalog_insert_authorized
  on public.gift_catalog for insert to authenticated
  with check (public.gift_plan_can_edit());

drop policy if exists gift_catalog_update_authorized on public.gift_catalog;
create policy gift_catalog_update_authorized
  on public.gift_catalog for update to authenticated
  using (public.gift_plan_can_edit())
  with check (public.gift_plan_can_edit());

drop policy if exists gift_catalog_delete_authorized on public.gift_catalog;
create policy gift_catalog_delete_authorized
  on public.gift_catalog for delete to authenticated
  using (
    public.gift_plan_can_edit()
    and not public.gift_catalog_is_in_use(id)
  );

notify pgrst, 'reload schema';
