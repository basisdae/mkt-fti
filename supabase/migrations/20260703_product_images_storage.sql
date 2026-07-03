-- Product gallery — full setup (safe to re-run)
-- Run in Supabase Dashboard → SQL Editor

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- product_images table
-- ---------------------------------------------------------------------------

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  image_path text,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_images
  add column if not exists image_path text;

create index if not exists product_images_product_id_idx
  on public.product_images (product_id);

create index if not exists product_images_cover_idx
  on public.product_images (product_id, is_cover)
  where is_cover = true;

create index if not exists product_images_sort_idx
  on public.product_images (product_id, sort_order);

-- updated_at trigger (reuse set_updated_at from main schema if present)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_product_images_updated_at on public.product_images;
create trigger set_product_images_updated_at
  before update on public.product_images
  for each row execute function public.set_updated_at();

alter table public.product_images disable row level security;

-- ---------------------------------------------------------------------------
-- Storage bucket + policies
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product_images_insert" on storage.objects;
create policy "product_images_insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

drop policy if exists "product_images_update" on storage.objects;
create policy "product_images_update"
  on storage.objects for update
  using (bucket_id = 'product-images');

drop policy if exists "product_images_delete" on storage.objects;
create policy "product_images_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images');
