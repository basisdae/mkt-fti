-- Factory visit / facility photos (separate from supplier logo).
create table if not exists public.supplier_gallery_images (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  image_url text not null,
  image_path text not null default '',
  alt_text text not null default '',
  category text not null default 'factory_visit',
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_gallery_images_supplier_id_idx
  on public.supplier_gallery_images (supplier_id);

create index if not exists supplier_gallery_images_sort_idx
  on public.supplier_gallery_images (supplier_id, sort_order);

create index if not exists supplier_gallery_images_cover_idx
  on public.supplier_gallery_images (supplier_id, is_cover)
  where is_cover = true;

drop trigger if exists supplier_gallery_images_set_updated_at
  on public.supplier_gallery_images;
create trigger supplier_gallery_images_set_updated_at
  before update on public.supplier_gallery_images
  for each row execute function public.set_updated_at();

alter table public.supplier_gallery_images disable row level security;
