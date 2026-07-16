-- Reset primary admin password for app_users login.
-- Also update the matching user in Supabase Dashboard → Authentication → Users
-- (same email + password) so Gift Plans Auth Bridge (signInWithPassword) works.

update public.app_users
set
  password = 'vtwigsiv1',
  updated_at = now()
where lower(email) = 'mkt.dir@functioninter.co.th';
