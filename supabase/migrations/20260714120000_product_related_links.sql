-- Related products: directed links by product ID (no duplicated product data).
-- Reverse "Compatible With" is derived at read time from incoming links.

create extension if not exists "pgcrypto";

create table if not exists public.product_related_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  related_product_id uuid not null references public.products (id) on delete cascade,
  relation_type text not null
    check (relation_type in ('consumable', 'accessory', 'compatible')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_related_links_no_self_link
    check (product_id <> related_product_id),
  constraint product_related_links_unique_triplet
    unique (product_id, related_product_id, relation_type)
);

create index if not exists product_related_links_product_id_idx
  on public.product_related_links (product_id);

create index if not exists product_related_links_related_product_id_idx
  on public.product_related_links (related_product_id);

create index if not exists product_related_links_relation_type_idx
  on public.product_related_links (relation_type);

drop trigger if exists product_related_links_set_updated_at on public.product_related_links;
create trigger product_related_links_set_updated_at
  before update on public.product_related_links
  for each row execute function public.set_updated_at();

alter table public.product_related_links disable row level security;

notify pgrst, 'reload schema';
