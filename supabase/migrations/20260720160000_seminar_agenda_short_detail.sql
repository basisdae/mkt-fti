-- Per-event agenda note (compact subtitle on the planner; not library master data).

alter table public.seminar_agenda_items
  add column if not exists agenda_short_detail text not null default '';

comment on column public.seminar_agenda_items.agenda_short_detail is
  'Short agenda-only note for this event session (1–2 lines); not synced from library.';
