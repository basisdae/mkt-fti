-- =============================================================================
-- MKT Headquarter — complete schema sync (local + production)
-- Idempotent. Safe to run multiple times.
-- Covers: products archive/spec, supplier logos/gallery, product assets,
--         app users, auth audit, asset platforms.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Shared updated_at helper (no-op if already present)
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
-- Products: specification, archive
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists specification jsonb not null default '{}'::jsonb;

alter table public.products
  add column if not exists spec_status text not null default 'not_started';

alter table public.products
  add column if not exists is_archived boolean not null default false;

-- Backfill (explicit for existing rows)
update public.products
set is_archived = false
where is_archived is distinct from false;

update public.products
set specification = '{}'::jsonb
where specification is null;

update public.products
set spec_status = 'not_started'
where spec_status is null or spec_status = '';

create index if not exists products_is_archived_idx
  on public.products (is_archived);

create index if not exists products_spec_status_idx
  on public.products (spec_status);

-- ---------------------------------------------------------------------------
-- Suppliers: logo columns
-- ---------------------------------------------------------------------------

alter table public.suppliers
  add column if not exists logo_url text;

alter table public.suppliers
  add column if not exists logo_path text;

-- ---------------------------------------------------------------------------
-- Product images: optional metadata columns
-- ---------------------------------------------------------------------------

alter table public.product_images
  add column if not exists image_type text not null default '';

alter table public.product_images
  add column if not exists usage_tags jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- Product media links (Product Assets)
-- ---------------------------------------------------------------------------

create table if not exists public.product_media_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  title text not null default '',
  type text not null default 'source_page',
  platform text not null default '',
  url text not null default '',
  embed_url text,
  source_page_url text,
  video_reference_id text,
  video_file_name text,
  cover_image_url text,
  duration text,
  remark text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrate older draft column names if present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_media_links'
      and column_name = 'media_type'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_media_links'
      and column_name = 'type'
  ) then
    alter table public.product_media_links rename column media_type to type;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_media_links'
      and column_name = 'is_active'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_media_links'
      and column_name = 'active'
  ) then
    alter table public.product_media_links rename column is_active to active;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_media_links'
      and column_name = 'video_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_media_links'
      and column_name = 'video_reference_id'
  ) then
    alter table public.product_media_links rename column video_id to video_reference_id;
  end if;
end $$;

alter table public.product_media_links
  add column if not exists title text not null default '';
alter table public.product_media_links
  add column if not exists type text not null default 'source_page';
alter table public.product_media_links
  add column if not exists platform text not null default '';
alter table public.product_media_links
  add column if not exists url text not null default '';
alter table public.product_media_links
  add column if not exists embed_url text;
alter table public.product_media_links
  add column if not exists source_page_url text;
alter table public.product_media_links
  add column if not exists video_reference_id text;
alter table public.product_media_links
  add column if not exists video_file_name text;
alter table public.product_media_links
  add column if not exists cover_image_url text;
alter table public.product_media_links
  add column if not exists duration text;
alter table public.product_media_links
  add column if not exists remark text;
alter table public.product_media_links
  add column if not exists active boolean not null default true;
alter table public.product_media_links
  add column if not exists sort_order integer not null default 0;
alter table public.product_media_links
  add column if not exists created_at timestamptz not null default now();
alter table public.product_media_links
  add column if not exists updated_at timestamptz not null default now();

update public.product_media_links
set source_page_url = url
where (source_page_url is null or source_page_url = '')
  and url is not null
  and url <> '';

create index if not exists product_media_links_product_id_idx
  on public.product_media_links (product_id);
create index if not exists product_media_links_active_idx
  on public.product_media_links (active);
create index if not exists product_media_links_sort_order_idx
  on public.product_media_links (sort_order);
create index if not exists product_media_links_product_sort_idx
  on public.product_media_links (product_id, sort_order);

drop trigger if exists product_media_links_set_updated_at on public.product_media_links;
create trigger product_media_links_set_updated_at
  before update on public.product_media_links
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Supplier gallery images
-- ---------------------------------------------------------------------------

create table if not exists public.supplier_gallery_images (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  image_url text not null,
  image_path text not null default '',
  alt_text text not null default '',
  category text not null default 'factory_visit',
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_gallery_images_supplier_id_idx
  on public.supplier_gallery_images (supplier_id);
create index if not exists supplier_gallery_images_sort_idx
  on public.supplier_gallery_images (supplier_id, sort_order);
create index if not exists supplier_gallery_images_cover_idx
  on public.supplier_gallery_images (supplier_id, is_cover)
  where is_cover = true;

drop trigger if exists supplier_gallery_images_set_updated_at
  on public.supplier_gallery_images;
create trigger supplier_gallery_images_set_updated_at
  before update on public.supplier_gallery_images
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- App users (managed accounts)
-- ---------------------------------------------------------------------------

create table if not exists public.app_users (
  id text primary key,
  email text not null unique,
  password text not null,
  display_name text not null default '',
  role text not null default 'mkt_hq',
  permissions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_email_idx on public.app_users (email);
create index if not exists app_users_role_idx on public.app_users (role);

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at
  before update on public.app_users
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth audit logs
-- ---------------------------------------------------------------------------

create table if not exists public.auth_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id text not null default '',
  actor_email text not null default '',
  target_user_id text not null default '',
  target_email text not null default '',
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists auth_audit_logs_created_at_idx
  on public.auth_audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Asset platforms (Product Assets platform config)
-- ---------------------------------------------------------------------------

create table if not exists public.asset_platforms (
  id text primary key,
  name text not null,
  icon_key text not null default 'link',
  color_token text not null default 'gray',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_platforms_sort_idx
  on public.asset_platforms (sort_order);

drop trigger if exists asset_platforms_set_updated_at on public.asset_platforms;
create trigger asset_platforms_set_updated_at
  before update on public.asset_platforms
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: match existing MVP product tables (disabled)
-- ---------------------------------------------------------------------------

alter table public.products disable row level security;
alter table public.suppliers disable row level security;
alter table public.product_media_links disable row level security;
alter table public.supplier_gallery_images disable row level security;
alter table public.app_users disable row level security;
alter table public.auth_audit_logs disable row level security;
alter table public.asset_platforms disable row level security;

-- ---------------------------------------------------------------------------
-- Refresh PostgREST schema cache
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
