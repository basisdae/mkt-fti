-- Monthly Work Plan — post-migration safety checks
-- Run in Supabase SQL Editor AFTER applying both migrations.
-- Read-only verification; does not modify data.

-- 1) New tables exist
select
  to_regclass('public.mkt_work_items') as mkt_work_items,
  to_regclass('public.mkt_work_subtasks') as mkt_work_subtasks;

-- 2) RLS enabled on new tables only
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('mkt_work_items', 'mkt_work_subtasks');

-- 3) Legacy tables untouched (row counts — compare before/after migration if needed)
select 'products' as table_name, count(*) as row_count from public.products
union all
select 'suppliers', count(*) from public.suppliers
union all
select 'gift_plans', count(*) from public.gift_plans
union all
select 'seminar_events', count(*) from public.seminar_events
union all
select 'app_users', count(*) from public.app_users;

-- 4) No duplicate work items by id (should always be 0 rows)
select id, count(*) as duplicates
from public.mkt_work_items
group by id
having count(*) > 1;

-- 5) Placement integrity (plan_year/plan_month pairs)
select id, title, plan_year, plan_month, sort_order
from public.mkt_work_items
where (plan_year is null) <> (plan_month is null);

-- 6) Monthly plan helpers exist
select proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'monthly_plan_can_view',
    'monthly_plan_can_edit',
    'monthly_plan_current_user'
  )
order by proname;
