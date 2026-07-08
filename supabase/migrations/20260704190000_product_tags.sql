-- Dynamic product classification tags (Filter System / Function / IN-OUT).

create extension if not exists "pgcrypto";

create table if not exists public.product_tag_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key text not null unique,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_tags (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.product_tag_groups (id) on delete cascade,
  label text not null,
  value text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, value)
);

create table if not exists public.product_tag_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  tag_id uuid not null references public.product_tags (id) on delete cascade,
  custom_label text,
  created_at timestamptz not null default now(),
  unique (product_id, tag_id)
);

create index if not exists product_tags_group_id_idx
  on public.product_tags (group_id);

create index if not exists product_tag_links_product_id_idx
  on public.product_tag_links (product_id);

create index if not exists product_tag_links_tag_id_idx
  on public.product_tag_links (tag_id);

drop trigger if exists product_tag_groups_set_updated_at on public.product_tag_groups;
create trigger product_tag_groups_set_updated_at
  before update on public.product_tag_groups
  for each row execute function public.set_updated_at();

drop trigger if exists product_tags_set_updated_at on public.product_tags;
create trigger product_tags_set_updated_at
  before update on public.product_tags
  for each row execute function public.set_updated_at();

alter table public.product_tag_groups disable row level security;
alter table public.product_tags disable row level security;
alter table public.product_tag_links disable row level security;

notify pgrst, 'reload schema';
