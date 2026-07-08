-- Configurable platforms for Product Assets (admin-managed).
create table if not exists public.asset_platforms (
  id text primary key,
  name text not null,
  icon_key text not null default 'link',
  color_token text not null default 'gray',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_platforms_sort_idx
  on public.asset_platforms (sort_order);

drop trigger if exists asset_platforms_set_updated_at on public.asset_platforms;
create trigger asset_platforms_set_updated_at
  before update on public.asset_platforms
  for each row execute function public.set_updated_at();

alter table public.asset_platforms disable row level security;
