-- Product specification + archive flags
alter table public.products
  add column if not exists specification jsonb not null default '{}'::jsonb;

alter table public.products
  add column if not exists spec_status text not null default 'not_started';

alter table public.products
  add column if not exists is_archived boolean not null default false;

create index if not exists products_is_archived_idx
  on public.products (is_archived);

-- App users (managed accounts — single source of truth)
create table if not exists public.app_users (
  id text primary key,
  email text not null unique,
  password text not null,
  display_name text not null default '',
  role text not null default 'mkt_hq',
  permissions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_email_idx on public.app_users (email);
create index if not exists app_users_role_idx on public.app_users (role);

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at
  before update on public.app_users
  for each row execute function public.set_updated_at();

alter table public.app_users disable row level security;

-- Auth activity / audit log
create table if not exists public.auth_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id text not null default '',
  actor_email text not null default '',
  target_user_id text not null default '',
  target_email text not null default '',
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists auth_audit_logs_created_at_idx
  on public.auth_audit_logs (created_at desc);

alter table public.auth_audit_logs disable row level security;
