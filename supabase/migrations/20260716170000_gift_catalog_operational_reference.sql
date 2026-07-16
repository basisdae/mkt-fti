-- Gift Catalog: reference URL + operational status (procurement tracking).
-- Also snapshots on gift_plan_items for purchasing summary/export.
-- Apply manually in Supabase SQL Editor. Do NOT auto-apply from the app.
--
-- Existing rows: operational_status defaults to 'interested'.
-- status column remains record status (active / inactive / archived).

-- ---------------------------------------------------------------------------
-- 1. Enum: operational_status (stable English values, Thai labels in UI only)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'gift_catalog_operational_status') then
    create type public.gift_catalog_operational_status as enum (
      'interested',
      'in_progress',
      'ordered',
      'blocked',
      'completed',
      'received'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. gift_catalog columns
-- ---------------------------------------------------------------------------
alter table public.gift_catalog
  add column if not exists reference_url text,
  add column if not exists operational_status public.gift_catalog_operational_status
    not null default 'interested';

comment on column public.gift_catalog.reference_url is
  'Optional source/product/marketplace link (http/https only). Display + purchasing; not in sales communication.';

comment on column public.gift_catalog.operational_status is
  'Procurement workflow status (separate from record status / archive).';

comment on column public.gift_catalog.status is
  'Record status: active, inactive, or archived (not operational workflow).';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'gift_catalog_reference_url_chk'
      and conrelid = 'public.gift_catalog'::regclass
  ) then
    alter table public.gift_catalog
      add constraint gift_catalog_reference_url_chk
      check (
        reference_url is null
        or btrim(reference_url) = ''
        or reference_url ~* '^https?://'
      );
  end if;
end $$;

create index if not exists gift_catalog_operational_status_idx
  on public.gift_catalog (operational_status);

-- ---------------------------------------------------------------------------
-- 3. gift_plan_items snapshot columns (frozen at plan save)
-- ---------------------------------------------------------------------------
alter table public.gift_plan_items
  add column if not exists reference_url text,
  add column if not exists operational_status text not null default 'interested';

comment on column public.gift_plan_items.reference_url is
  'Per-plan snapshot of catalog reference_url at save time.';

comment on column public.gift_plan_items.operational_status is
  'Per-plan snapshot of catalog operational_status at save time (English value).';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'gift_plan_items_reference_url_chk'
      and conrelid = 'public.gift_plan_items'::regclass
  ) then
    alter table public.gift_plan_items
      add constraint gift_plan_items_reference_url_chk
      check (
        reference_url is null
        or btrim(reference_url) = ''
        or reference_url ~* '^https?://'
      );
  end if;
end $$;

-- Backfill existing plan items from catalog where linked.
update public.gift_plan_items i
set
  reference_url = c.reference_url,
  operational_status = c.operational_status::text
from public.gift_catalog c
where i.gift_catalog_id = c.id
  and i.reference_url is null
  and i.operational_status = 'interested';
