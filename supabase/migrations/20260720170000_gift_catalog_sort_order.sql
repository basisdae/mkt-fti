-- Manual display order for gift catalog library (separate from name/price/status sorting).

alter table public.gift_catalog
  add column if not exists sort_order integer not null default 0;

with ranked as (
  select
    id,
    row_number() over (order by updated_at desc, id asc) - 1 as rn
  from public.gift_catalog
)
update public.gift_catalog g
set sort_order = ranked.rn
from ranked
where g.id = ranked.id;

create index if not exists gift_catalog_sort_order_idx
  on public.gift_catalog (sort_order);

comment on column public.gift_catalog.sort_order is
  'Manual library order; used when sort mode is manual in the gift catalog UI.';

notify pgrst, 'reload schema';
