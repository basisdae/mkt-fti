-- Monthly Work Plan — RLS (permission based; excludes rnd / sale / pu at template level)
-- Apply manually after 20260720120000_monthly_work_plan.sql

create or replace function public.monthly_plan_jwt_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

revoke all on function public.monthly_plan_jwt_email() from public;
grant execute on function public.monthly_plan_jwt_email() to authenticated;

create or replace function public.monthly_plan_current_user()
returns table (
  email text,
  role text,
  permissions jsonb,
  is_active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(u.email),
    u.role,
    u.permissions,
    u.is_active
  from public.app_users u
  where lower(u.email) = public.monthly_plan_jwt_email()
  limit 1;
$$;

revoke all on function public.monthly_plan_current_user() from public;
grant execute on function public.monthly_plan_current_user() to authenticated;

create or replace function public.monthly_plan_can_view()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select * into rec from public.monthly_plan_current_user();
  if not found or rec.is_active is not true then
    return false;
  end if;

  if rec.role = 'admin' then
    return true;
  end if;

  return rec.permissions ? 'monthly_plan.view'
    or rec.permissions ? 'monthly_plan.edit';
end;
$$;

revoke all on function public.monthly_plan_can_view() from public;
grant execute on function public.monthly_plan_can_view() to authenticated;

create or replace function public.monthly_plan_can_edit()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select * into rec from public.monthly_plan_current_user();
  if not found or rec.is_active is not true then
    return false;
  end if;

  if rec.role = 'admin' then
    return true;
  end if;

  return rec.permissions ? 'monthly_plan.edit';
end;
$$;

revoke all on function public.monthly_plan_can_edit() from public;
grant execute on function public.monthly_plan_can_edit() to authenticated;

alter table public.mkt_work_items enable row level security;
alter table public.mkt_work_subtasks enable row level security;

drop policy if exists mkt_work_items_select on public.mkt_work_items;
create policy mkt_work_items_select on public.mkt_work_items
  for select to authenticated
  using (public.monthly_plan_can_view());

drop policy if exists mkt_work_items_insert on public.mkt_work_items;
create policy mkt_work_items_insert on public.mkt_work_items
  for insert to authenticated
  with check (public.monthly_plan_can_edit());

drop policy if exists mkt_work_items_update on public.mkt_work_items;
create policy mkt_work_items_update on public.mkt_work_items
  for update to authenticated
  using (public.monthly_plan_can_edit())
  with check (public.monthly_plan_can_edit());

drop policy if exists mkt_work_items_delete on public.mkt_work_items;
create policy mkt_work_items_delete on public.mkt_work_items
  for delete to authenticated
  using (public.monthly_plan_can_edit());

drop policy if exists mkt_work_subtasks_select on public.mkt_work_subtasks;
create policy mkt_work_subtasks_select on public.mkt_work_subtasks
  for select to authenticated
  using (public.monthly_plan_can_view());

drop policy if exists mkt_work_subtasks_insert on public.mkt_work_subtasks;
create policy mkt_work_subtasks_insert on public.mkt_work_subtasks
  for insert to authenticated
  with check (public.monthly_plan_can_edit());

drop policy if exists mkt_work_subtasks_update on public.mkt_work_subtasks;
create policy mkt_work_subtasks_update on public.mkt_work_subtasks
  for update to authenticated
  using (public.monthly_plan_can_edit())
  with check (public.monthly_plan_can_edit());

drop policy if exists mkt_work_subtasks_delete on public.mkt_work_subtasks;
create policy mkt_work_subtasks_delete on public.mkt_work_subtasks
  for delete to authenticated
  using (public.monthly_plan_can_edit());

grant select, insert, update, delete on table public.mkt_work_items to authenticated;
grant select, insert, update, delete on table public.mkt_work_subtasks to authenticated;
