-- Add image_type column to product_images for category metadata
-- Safe to re-run (idempotent)

alter table public.product_images
  add column if not exists image_type text not null default '';
