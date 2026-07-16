-- Grant Gift Plans access to primary MKT support operator (mkt.support@functioninter.co.th)
-- Run manually in Supabase SQL Editor when approved.

-- Ensure app_users row has mkt_hq role + gift plan permissions
update public.app_users
set
  role = 'mkt_hq',
  permissions = (
    select coalesce(jsonb_agg(distinct elem order by elem), '[]'::jsonb)
    from (
      select jsonb_array_elements_text(
        coalesce(permissions, '[]'::jsonb)
          || '["gift_plans.view","gift_plans.edit","gift_plans.export"]'::jsonb
      ) as elem
    ) merged
  ),
  updated_at = now()
where lower(email) = 'mkt.support@functioninter.co.th';

-- RLS: recognize primary Gift Plans operators by email (in addition to admin / mkt_hq rules)
create or replace function public.gift_plan_is_primary_operator()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.gift_plan_jwt_email() in (
    'mkt.dir@functioninter.co.th',
    'mkt.support@functioninter.co.th'
  );
$$;

revoke all on function public.gift_plan_is_primary_operator() from public;
grant execute on function public.gift_plan_is_primary_operator() to authenticated;

create or replace function public.gift_plan_can_view()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  if public.gift_plan_is_primary_operator() then
    return true;
  end if;

  select * into rec from public.gift_plan_current_user();
  if not found or rec.is_active is not true then
    return false;
  end if;

  if rec.role = 'admin' then
    return true;
  end if;

  if rec.role = 'mkt_hq' then
    return rec.permissions ? 'gift_plans.view'
      or rec.permissions ? 'gift_plans.edit'
      or rec.permissions ? 'gift_plans.export';
  end if;

  return false;
end;
$$;

create or replace function public.gift_plan_can_edit()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  if public.gift_plan_is_primary_operator() then
    return true;
  end if;

  select * into rec from public.gift_plan_current_user();
  if not found or rec.is_active is not true then
    return false;
  end if;

  if rec.role = 'admin' then
    return true;
  end if;

  if rec.role = 'mkt_hq' then
    return rec.permissions ? 'gift_plans.edit';
  end if;

  return false;
end;
$$;
