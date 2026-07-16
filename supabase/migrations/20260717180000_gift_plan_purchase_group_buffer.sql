-- Gift Plan: buffer % on purchase groups + backfill one group per ungrouped item.
-- Run manually in Supabase > SQL Editor > New query > Run
--
-- Scope: gift_plan_purchase_groups, gift_plan_items (UPDATE only)
-- Does NOT touch: products, suppliers, sales plans, customers, gift_catalog

-- 1) buffer_percentage on purchase groups (single source of truth)
alter table public.gift_plan_purchase_groups
  add column if not exists buffer_percentage numeric(8, 4) not null default 0;

alter table public.gift_plan_purchase_groups
  drop constraint if exists gift_plan_purchase_groups_buffer_percentage_chk;

alter table public.gift_plan_purchase_groups
  add constraint gift_plan_purchase_groups_buffer_percentage_chk
    check (buffer_percentage >= 0 and buffer_percentage <= 100);

comment on column public.gift_plan_purchase_groups.buffer_percentage is
  'Extra order buffer % for this purchasing group (0–100). CEILING applied to base qty.';

-- 2) Backfill: every gift_plan_item without purchase_group_id gets its own group.
--    Existing grouped items are unchanged. No items deleted.
do $$
declare
  r record;
  new_group_id uuid;
  items_backfilled integer := 0;
  groups_created integer := 0;
begin
  for r in
    select
      i.id as item_id,
      t.plan_id,
      coalesce(nullif(btrim(i.gift_name), ''), 'Gift item') as gift_label
    from public.gift_plan_items i
    join public.gift_plan_tiers t on t.id = i.tier_id
    where i.purchase_group_id is null
    order by t.plan_id, i.id
  loop
    insert into public.gift_plan_purchase_groups (
      plan_id,
      label,
      notes,
      buffer_percentage
    )
    values (
      r.plan_id,
      r.gift_label,
      '',
      0
    )
    returning id into new_group_id;

    update public.gift_plan_items
    set purchase_group_id = new_group_id
    where id = r.item_id;

    items_backfilled := items_backfilled + 1;
    groups_created := groups_created + 1;
  end loop;

  raise notice 'gift_plan backfill: % items linked, % purchase groups created',
    items_backfilled, groups_created;
end $$;

-- 3) Refresh PostgREST schema cache
notify pgrst, 'reload schema';
