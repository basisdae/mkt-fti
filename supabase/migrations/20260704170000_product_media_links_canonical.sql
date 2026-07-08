-- Canonical product_media_links table for Product Assets.
-- Safe to run on empty projects and on projects with older column names.

create extension if not exists "pgcrypto";

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

-- Migrate older column names if an earlier draft table exists.
do $$
begin
  -- media_type -> type
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_media_links'
      and column_name = 'media_type'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_media_links'
      and column_name = 'type'
  ) then
    alter table public.product_media_links rename column media_type to type;
  end if;

  -- is_active -> active
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_media_links'
      and column_name = 'is_active'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_media_links'
      and column_name = 'active'
  ) then
    alter table public.product_media_links rename column is_active to active;
  end if;

  -- video_id -> video_reference_id
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_media_links'
      and column_name = 'video_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_media_links'
      and column_name = 'video_reference_id'
  ) then
    alter table public.product_media_links rename column video_id to video_reference_id;
  end if;
end $$;

-- Ensure all required columns exist (no-op when already present).
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

-- Backfill source_page_url from url when empty.
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

-- updated_at trigger (shared helper from schema.sql)
do $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'set_updated_at'
  ) then
    drop trigger if exists product_media_links_set_updated_at
      on public.product_media_links;
    create trigger product_media_links_set_updated_at
      before update on public.product_media_links
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Match existing product tables (MVP: RLS disabled).
alter table public.product_media_links disable row level security;

-- Notify PostgREST to reload schema cache.
notify pgrst, 'reload schema';
