-- Seminar Planner — RLS policies (role + permission based; no email override)
-- Apply manually after 20260717120000_seminar_planner.sql

create or replace function public.seminar_planner_jwt_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

revoke all on function public.seminar_planner_jwt_email() from public;
grant execute on function public.seminar_planner_jwt_email() to authenticated;

create or replace function public.seminar_planner_current_user()
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
  where lower(u.email) = public.seminar_planner_jwt_email()
  limit 1;
$$;

revoke all on function public.seminar_planner_current_user() from public;
grant execute on function public.seminar_planner_current_user() to authenticated;

create or replace function public.seminar_planner_can_view()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select * into rec from public.seminar_planner_current_user();
  if not found or rec.is_active is not true then
    return false;
  end if;

  if rec.role = 'admin' then
    return true;
  end if;

  return rec.permissions ? 'seminar_planner.view'
    or rec.permissions ? 'seminar_planner.edit';
end;
$$;

revoke all on function public.seminar_planner_can_view() from public;
grant execute on function public.seminar_planner_can_view() to authenticated;

create or replace function public.seminar_planner_can_edit()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select * into rec from public.seminar_planner_current_user();
  if not found or rec.is_active is not true then
    return false;
  end if;

  if rec.role = 'admin' then
    return true;
  end if;

  return rec.permissions ? 'seminar_planner.edit';
end;
$$;

revoke all on function public.seminar_planner_can_edit() from public;
grant execute on function public.seminar_planner_can_edit() to authenticated;

-- Helper macro via DO blocks for each table
do $policy$
declare
  t text;
  tables text[] := array[
    'seminar_lib_target_groups',
    'seminar_lib_purposes',
    'seminar_lib_speakers',
    'seminar_lib_formats',
    'seminar_lib_session_statuses',
    'seminar_lib_categories',
    'seminar_lib_sessions',
    'seminar_events',
    'seminar_event_target_groups',
    'seminar_event_purposes',
    'seminar_agenda_items'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);

    execute format(
      'create policy %I_select on public.%I for select to authenticated using (public.seminar_planner_can_view())',
      t, t
    );
    execute format(
      'create policy %I_insert on public.%I for insert to authenticated with check (public.seminar_planner_can_edit())',
      t, t
    );
    execute format(
      'create policy %I_update on public.%I for update to authenticated using (public.seminar_planner_can_edit()) with check (public.seminar_planner_can_edit())',
      t, t
    );
    execute format(
      'create policy %I_delete on public.%I for delete to authenticated using (public.seminar_planner_can_edit())',
      t, t
    );
  end loop;
end
$policy$;

revoke all on public.seminar_lib_target_groups from anon;
revoke all on public.seminar_lib_purposes from anon;
revoke all on public.seminar_lib_speakers from anon;
revoke all on public.seminar_lib_formats from anon;
revoke all on public.seminar_lib_session_statuses from anon;
revoke all on public.seminar_lib_categories from anon;
revoke all on public.seminar_lib_sessions from anon;
revoke all on public.seminar_events from anon;
revoke all on public.seminar_event_target_groups from anon;
revoke all on public.seminar_event_purposes from anon;
revoke all on public.seminar_agenda_items from anon;

grant select, insert, update, delete on public.seminar_lib_target_groups to authenticated;
grant select, insert, update, delete on public.seminar_lib_purposes to authenticated;
grant select, insert, update, delete on public.seminar_lib_speakers to authenticated;
grant select, insert, update, delete on public.seminar_lib_formats to authenticated;
grant select, insert, update, delete on public.seminar_lib_session_statuses to authenticated;
grant select, insert, update, delete on public.seminar_lib_categories to authenticated;
grant select, insert, update, delete on public.seminar_lib_sessions to authenticated;
grant select, insert, update, delete on public.seminar_events to authenticated;
grant select, insert, update, delete on public.seminar_event_target_groups to authenticated;
grant select, insert, update, delete on public.seminar_event_purposes to authenticated;
grant select, insert, update, delete on public.seminar_agenda_items to authenticated;

notify pgrst, 'reload schema';
