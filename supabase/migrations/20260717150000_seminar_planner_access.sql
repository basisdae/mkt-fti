-- Grant Seminar Planner permissions to MKT Support operator (app_users data only)
-- mkt.support maps to role mkt_hq in app_users — access via explicit permissions, not email override in app code.
-- admin role (mkt.dir) already has full access via RLS.

update public.app_users
set
  permissions = (
    select jsonb_agg(distinct elem)
    from (
      select jsonb_array_elements_text(
        coalesce(permissions, '[]'::jsonb) || '["seminar_planner.view","seminar_planner.edit"]'::jsonb
      ) as elem
    ) s
  ),
  updated_at = now()
where lower(email) = 'mkt.support@functioninter.co.th'
  and not (
    coalesce(permissions, '[]'::jsonb) ? 'seminar_planner.view'
    and coalesce(permissions, '[]'::jsonb) ? 'seminar_planner.edit'
  );

notify pgrst, 'reload schema';
