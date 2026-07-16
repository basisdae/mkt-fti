-- Seminar Planner module — schema (MKT HQ Fx)
-- Apply manually in Supabase SQL Editor. Do NOT auto-apply from the app.
-- Does NOT modify products, suppliers, gift plans, simulator, or app_users structure.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums (stable English values; Thai labels in UI only)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'seminar_event_status') then
    create type public.seminar_event_status as enum (
      'idea',
      'planning',
      'pending_review',
      'needs_revision',
      'approved',
      'ready_to_execute',
      'completed',
      'on_hold'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'seminar_event_format') then
    create type public.seminar_event_format as enum (
      'on_site',
      'online',
      'hybrid'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Master data library tables
-- ---------------------------------------------------------------------------

create table if not exists public.seminar_lib_target_groups (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seminar_lib_target_groups_name_chk check (char_length(btrim(name)) > 0)
);

create table if not exists public.seminar_lib_purposes (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seminar_lib_purposes_name_chk check (char_length(btrim(name)) > 0)
);

create table if not exists public.seminar_lib_speakers (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,
  name text not null,
  role_hint text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seminar_lib_speakers_name_chk check (char_length(btrim(name)) > 0)
);

create table if not exists public.seminar_lib_formats (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seminar_lib_formats_name_chk check (char_length(btrim(name)) > 0)
);

create table if not exists public.seminar_lib_session_statuses (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seminar_lib_session_statuses_name_chk check (char_length(btrim(name)) > 0)
);

create table if not exists public.seminar_lib_categories (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,
  name text not null,
  description text not null default '',
  color_hint text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seminar_lib_categories_name_chk check (char_length(btrim(name)) > 0)
);

create table if not exists public.seminar_lib_sessions (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,
  category_name text not null default '',
  title text not null,
  recommended_format text not null default '',
  recommended_minutes integer,
  recommended_speaker text not null default '',
  detail_bullets jsonb not null default '[]'::jsonb,
  objectives_bullets jsonb not null default '[]'::jsonb,
  outcomes_bullets jsonb not null default '[]'::jsonb,
  target_group_names text[] not null default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seminar_lib_sessions_title_chk check (char_length(btrim(title)) > 0),
  constraint seminar_lib_sessions_minutes_chk
    check (recommended_minutes is null or recommended_minutes >= 0)
);

comment on table public.seminar_lib_sessions is
  'Session topic library. Bullets stored as JSON array [{id,text,sort_order}].';

-- ---------------------------------------------------------------------------
-- Events (seminar plans)
-- ---------------------------------------------------------------------------

create table if not exists public.seminar_events (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,
  title text not null,
  event_type text not null default '',
  start_date date,
  end_date date,
  daily_start_time time,
  daily_end_time time,
  venue text not null default '',
  event_format public.seminar_event_format not null default 'on_site',
  estimated_attendees integer,
  owner text not null default '',
  team_members text not null default '',
  status public.seminar_event_status not null default 'idea',
  notes text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_email text,
  updated_by_email text,
  constraint seminar_events_title_chk check (char_length(btrim(title)) > 0),
  constraint seminar_events_attendees_chk
    check (estimated_attendees is null or estimated_attendees >= 0)
);

create table if not exists public.seminar_event_target_groups (
  event_id uuid not null references public.seminar_events (id) on delete cascade,
  target_group_id uuid not null references public.seminar_lib_target_groups (id) on delete restrict,
  primary key (event_id, target_group_id)
);

create table if not exists public.seminar_event_purposes (
  event_id uuid not null references public.seminar_events (id) on delete cascade,
  purpose_id uuid not null references public.seminar_lib_purposes (id) on delete restrict,
  primary key (event_id, purpose_id)
);

-- ---------------------------------------------------------------------------
-- Agenda items (per-event snapshot; library edits do not propagate)
-- ---------------------------------------------------------------------------

create table if not exists public.seminar_agenda_items (
  id uuid primary key default gen_random_uuid(),
  seed_key text unique,
  event_id uuid not null references public.seminar_events (id) on delete cascade,
  library_session_id uuid references public.seminar_lib_sessions (id) on delete set null,
  sort_order integer not null default 0,
  title text not null,
  category_name text not null default '',
  format_name text not null default '',
  session_date date,
  start_time time,
  end_time time,
  duration_minutes integer,
  primary_speaker text not null default '',
  co_speakers text not null default '',
  detail_bullets jsonb not null default '[]'::jsonb,
  objectives_bullets jsonb not null default '[]'::jsonb,
  outcomes_bullets jsonb not null default '[]'::jsonb,
  target_group_names text[] not null default '{}',
  team_notes text not null default '',
  owner_name text not null default '',
  status_name text not null default '',
  is_parallel boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seminar_agenda_items_title_chk check (char_length(btrim(title)) > 0),
  constraint seminar_agenda_items_minutes_chk
    check (duration_minutes is null or duration_minutes >= 0)
);

create index if not exists seminar_events_status_idx on public.seminar_events (status);
create index if not exists seminar_events_archived_idx on public.seminar_events (is_archived);
create index if not exists seminar_events_updated_idx on public.seminar_events (updated_at desc);
create index if not exists seminar_agenda_items_event_sort_idx
  on public.seminar_agenda_items (event_id, sort_order);
create index if not exists seminar_lib_sessions_category_idx
  on public.seminar_lib_sessions (category_name);
create index if not exists seminar_lib_sessions_active_idx
  on public.seminar_lib_sessions (is_active, sort_order);

-- updated_at triggers
drop trigger if exists seminar_lib_target_groups_set_updated_at on public.seminar_lib_target_groups;
create trigger seminar_lib_target_groups_set_updated_at
  before update on public.seminar_lib_target_groups
  for each row execute function public.set_updated_at();

drop trigger if exists seminar_lib_purposes_set_updated_at on public.seminar_lib_purposes;
create trigger seminar_lib_purposes_set_updated_at
  before update on public.seminar_lib_purposes
  for each row execute function public.set_updated_at();

drop trigger if exists seminar_lib_speakers_set_updated_at on public.seminar_lib_speakers;
create trigger seminar_lib_speakers_set_updated_at
  before update on public.seminar_lib_speakers
  for each row execute function public.set_updated_at();

drop trigger if exists seminar_lib_formats_set_updated_at on public.seminar_lib_formats;
create trigger seminar_lib_formats_set_updated_at
  before update on public.seminar_lib_formats
  for each row execute function public.set_updated_at();

drop trigger if exists seminar_lib_session_statuses_set_updated_at on public.seminar_lib_session_statuses;
create trigger seminar_lib_session_statuses_set_updated_at
  before update on public.seminar_lib_session_statuses
  for each row execute function public.set_updated_at();

drop trigger if exists seminar_lib_categories_set_updated_at on public.seminar_lib_categories;
create trigger seminar_lib_categories_set_updated_at
  before update on public.seminar_lib_categories
  for each row execute function public.set_updated_at();

drop trigger if exists seminar_lib_sessions_set_updated_at on public.seminar_lib_sessions;
create trigger seminar_lib_sessions_set_updated_at
  before update on public.seminar_lib_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists seminar_events_set_updated_at on public.seminar_events;
create trigger seminar_events_set_updated_at
  before update on public.seminar_events
  for each row execute function public.set_updated_at();

drop trigger if exists seminar_agenda_items_set_updated_at on public.seminar_agenda_items;
create trigger seminar_agenda_items_set_updated_at
  before update on public.seminar_agenda_items
  for each row execute function public.set_updated_at();

alter table public.seminar_lib_target_groups enable row level security;
alter table public.seminar_lib_purposes enable row level security;
alter table public.seminar_lib_speakers enable row level security;
alter table public.seminar_lib_formats enable row level security;
alter table public.seminar_lib_session_statuses enable row level security;
alter table public.seminar_lib_categories enable row level security;
alter table public.seminar_lib_sessions enable row level security;
alter table public.seminar_events enable row level security;
alter table public.seminar_event_target_groups enable row level security;
alter table public.seminar_event_purposes enable row level security;
alter table public.seminar_agenda_items enable row level security;

notify pgrst, 'reload schema';
