-- Add usage_tags column to product_images for channel tagging
-- Stores JSON array of usage tag strings

alter table public.product_images
  add column if not exists usage_tags jsonb not null default '[]'::jsonb;
