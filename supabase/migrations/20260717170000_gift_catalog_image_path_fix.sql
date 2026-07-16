-- Gift Catalog: storage path for uploaded cover images.
-- Run once in Supabase > SQL Editor > New query > Run
--
-- Adds gift_catalog.image_path (nullable text) alongside existing image_url.
-- Legacy rows keep image_url; display resolves image_path first, then image_url.

alter table public.gift_catalog
  add column if not exists image_path text;

comment on column public.gift_catalog.image_path is
  'Supabase Storage path under product-images bucket, e.g. gift-catalog/{id}/cover-{uuid}.ext';

comment on column public.gift_catalog.image_url is
  'Public URL for cover image (derived from image_path or legacy external URL).';

-- Backfill path from stored public URLs (safe: only when image_path is still null).
update public.gift_catalog
set image_path = substring(
  image_url from '/storage/v1/object/public/product-images/(.+)$'
)
where image_path is null
  and image_url is not null
  and image_url like '%/storage/v1/object/public/product-images/%';

-- Refresh PostgREST schema cache so API sees the new column immediately.
notify pgrst, 'reload schema';
