-- Gift Plans security audit — run in Supabase SQL Editor after any migration.
-- Copy results back for review. Read-only queries.

-- 1) RLS enabled?
select
  c.relname as object_name,
  c.relkind as kind,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'gift_plans',
    'gift_plan_purchase_groups',
    'gift_plan_tiers',
    'gift_plan_items',
    'gift_catalog',
    'gift_plans_communication_v',
    'gift_plan_tiers_communication_v',
    'gift_plan_items_communication_v'
  )
order by c.relname;

-- 2) Table + view grants for anon / authenticated / service_role
select
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'gift_plans',
    'gift_plan_purchase_groups',
    'gift_plan_tiers',
    'gift_plan_items',
    'gift_catalog',
    'gift_plans_communication_v',
    'gift_plan_tiers_communication_v',
    'gift_plan_items_communication_v'
  )
  and grantee in ('anon', 'authenticated', 'service_role')
group by table_name, grantee
order by table_name, grantee;

-- 3) RLS policies on gift plan tables
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename like 'gift_plan%' or tablename = 'gift_catalog'
order by tablename, policyname;

-- 4) Simulate direct anon access (should fail after corrective migration)
-- Run separately in SQL editor using "Run as" anon if available, or test via REST:
-- curl with anon key: GET /rest/v1/gift_plans?select=id&limit=1
