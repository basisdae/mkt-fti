-- Supplier logos: DB columns only.
-- Logos are stored in the existing product-images bucket under suppliers/
-- (no new storage bucket).

alter table public.suppliers
  add column if not exists logo_url text;

alter table public.suppliers
  add column if not exists logo_path text;
