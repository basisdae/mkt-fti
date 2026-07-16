-- Add storage path for Gift Catalog cover images (uploaded to product-images/gift-catalog/...).
-- Run manually in Supabase SQL Editor.

alter table public.gift_catalog
  add column if not exists image_path text;

comment on column public.gift_catalog.image_path is
  'Supabase Storage path under product-images bucket, e.g. gift-catalog/{id}/cover-{uuid}.ext';

comment on column public.gift_catalog.image_url is
  'Public URL for cover image (derived from image_path or legacy external URL).';
