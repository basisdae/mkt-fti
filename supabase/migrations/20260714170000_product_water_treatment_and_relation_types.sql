-- Water Treatment System (two-table) + extended product_related_links relation types.
-- Does NOT modify existing product rows or specification JSONB.
-- Run manually in Supabase SQL Editor after approval.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- A. Extend product_related_links.relation_type (if table exists)
--    New types: consumable, spare_part, accessory, compatible, bundle
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'product_related_links'
  ) then
    alter table public.product_related_links
      drop constraint if exists product_related_links_relation_type_check;

    alter table public.product_related_links
      add constraint product_related_links_relation_type_check
      check (
        relation_type in (
          'consumable',
          'spare_part',
          'accessory',
          'compatible',
          'bundle'
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- B. Water treatment config (optional 1:1 per product)
-- ---------------------------------------------------------------------------

create table if not exists public.product_water_treatment (
  product_id uuid primary key
    references public.products (id) on delete cascade,
  main_systems text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_water_treatment_main_systems_allowed check (
    main_systems <@ array[
      'ro','uf','nf','mf','uv','carbon','sediment','softener',
      'mineral','alkaline','hydrogen','other'
    ]::text[]
  )
);

-- ---------------------------------------------------------------------------
-- C. Filtration stages (ordered rows; stage-only replacement FK)
-- ---------------------------------------------------------------------------

create table if not exists public.product_filtration_stages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null
    references public.products (id) on delete cascade,
  sort_order integer not null default 0,
  component_type text not null
    check (component_type in (
      'pp_sediment','cto_carbon','gac_carbon','ro_membrane',
      'uf_membrane','nf_membrane','mineral','alkaline','post_carbon',
      'resin','softener','uv','other'
    )),
  display_name text not null default '',
  specification text not null default '',
  quantity integer not null default 1
    check (quantity >= 1),
  replaceable boolean not null default false,
  replacement_interval text not null default '',
  related_product_id uuid
    references public.products (id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_filtration_stages_unique_order
    unique (product_id, sort_order)
);

create index if not exists product_filtration_stages_product_id_idx
  on public.product_filtration_stages (product_id);

create index if not exists product_filtration_stages_related_product_id_idx
  on public.product_filtration_stages (related_product_id)
  where related_product_id is not null;

create index if not exists product_filtration_stages_component_type_idx
  on public.product_filtration_stages (component_type);

-- ---------------------------------------------------------------------------
-- D. updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists product_water_treatment_set_updated_at
  on public.product_water_treatment;
create trigger product_water_treatment_set_updated_at
  before update on public.product_water_treatment
  for each row execute function public.set_updated_at();

drop trigger if exists product_filtration_stages_set_updated_at
  on public.product_filtration_stages;
create trigger product_filtration_stages_set_updated_at
  before update on public.product_filtration_stages
  for each row execute function public.set_updated_at();

alter table public.product_water_treatment disable row level security;
alter table public.product_filtration_stages disable row level security;

notify pgrst, 'reload schema';
