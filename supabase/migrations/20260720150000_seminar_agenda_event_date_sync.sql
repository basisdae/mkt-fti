-- Seminar Agenda — align session dates with project event date (legacy backfill)
-- Apply manually in Supabase SQL Editor after seminar planner migrations.
-- Safe: does NOT delete rows; only backfills/aligns dates.

-- 1) Backfill event start_date from agenda when project date is missing
update public.seminar_events e
set
  start_date = sub.session_date,
  updated_at = now()
from (
  select
    ai.event_id,
    min(ai.session_date) as session_date
  from public.seminar_agenda_items ai
  where ai.session_date is not null
  group by ai.event_id
) sub
where e.id = sub.event_id
  and e.start_date is null;

-- 2) Align all agenda session_date values to the project start_date
update public.seminar_agenda_items ai
set
  session_date = e.start_date,
  updated_at = now()
from public.seminar_events e
where ai.event_id = e.id
  and e.start_date is not null
  and ai.session_date is distinct from e.start_date;
