-- Monthly Work Plan — schema (MKT HQ)
-- Apply manually in Supabase SQL Editor. Do NOT auto-apply from the app.
-- Does NOT modify products, suppliers, gift plans, seminar, or sales plan data.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'mkt_work_status') then
    create type public.mkt_work_status as enum ('PLAN', 'WORK', 'DONE');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'mkt_work_priority') then
    create type public.mkt_work_priority as enum ('LOW', 'MEDIUM', 'HIGH');
  end if;
end $$;

create table if not exists public.mkt_work_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status public.mkt_work_status not null default 'PLAN',
  priority public.mkt_work_priority,
  plan_year integer,
  plan_month integer,
  sort_order integer not null default 0,
  owner_user_id text references public.app_users (id) on delete set null,
  collaborator_user_ids text[] not null default '{}'::text[],
  start_date date,
  deadline date,
  created_by_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mkt_work_items_title_chk check (char_length(btrim(title)) > 0),
  constraint mkt_work_items_plan_month_range_chk check (
    plan_month is null or (plan_month >= 1 and plan_month <= 12)
  ),
  constraint mkt_work_items_plan_pair_chk check (
    (plan_year is null and plan_month is null)
    or (plan_year is not null and plan_month is not null)
  )
);

create index if not exists mkt_work_items_plan_year_month_sort_idx
  on public.mkt_work_items (plan_year, plan_month, sort_order);

create index if not exists mkt_work_items_owner_user_id_idx
  on public.mkt_work_items (owner_user_id);

create index if not exists mkt_work_items_status_idx
  on public.mkt_work_items (status);

drop trigger if exists mkt_work_items_set_updated_at on public.mkt_work_items;
create trigger mkt_work_items_set_updated_at
  before update on public.mkt_work_items
  for each row execute function public.set_updated_at();

create table if not exists public.mkt_work_subtasks (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.mkt_work_items (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mkt_work_subtasks_title_chk check (char_length(btrim(title)) > 0)
);

create index if not exists mkt_work_subtasks_work_item_sort_idx
  on public.mkt_work_subtasks (work_item_id, sort_order);

drop trigger if exists mkt_work_subtasks_set_updated_at on public.mkt_work_subtasks;
create trigger mkt_work_subtasks_set_updated_at
  before update on public.mkt_work_subtasks
  for each row execute function public.set_updated_at();

comment on table public.mkt_work_items is
  'Canonical MKT HQ work items — monthly plan board is a view over this table.';

comment on table public.mkt_work_subtasks is
  'Checklist tasks under an MKT work item; progress derives from completion ratio.';
