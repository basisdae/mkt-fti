-- Product Assets links (canonical columns).
-- Prefer also applying 20260704170000_product_media_links_canonical.sql
-- which is fully idempotent and migrates older drafts.

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

create index if not exists product_media_links_product_id_idx
  on public.product_media_links (product_id);

create index if not exists product_media_links_active_idx
  on public.product_media_links (active);

create index if not exists product_media_links_sort_order_idx
  on public.product_media_links (sort_order);

drop trigger if exists product_media_links_set_updated_at on public.product_media_links;
create trigger product_media_links_set_updated_at
  before update on public.product_media_links
  for each row execute function public.set_updated_at();

alter table public.product_media_links disable row level security;

notify pgrst, 'reload schema';
