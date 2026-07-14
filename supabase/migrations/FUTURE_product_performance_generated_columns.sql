-- FUTURE: optional generated columns for list-filter milestone.
-- NOT applied in the current pass — performance lives in specification.performance JSONB.
-- Run only when GPD / flow / capacity range filters need indexed SQL queries.

alter table public.products
  add column if not exists perf_gpd numeric
    generated always as (
      nullif(trim(specification #>> '{performance,gpd}'), '')::numeric
    ) stored,
  add column if not exists perf_rated_flow_lh numeric
    generated always as (
      nullif(trim(specification #>> '{performance,ratedFlowLh}'), '')::numeric
    ) stored,
  add column if not exists perf_capacity_l numeric
    generated always as (
      nullif(trim(specification #>> '{performance,capacityL}'), '')::numeric
    ) stored;

create index if not exists products_perf_gpd_idx
  on public.products (perf_gpd)
  where perf_gpd is not null;

create index if not exists products_perf_rated_flow_lh_idx
  on public.products (perf_rated_flow_lh)
  where perf_rated_flow_lh is not null;

create index if not exists products_perf_capacity_l_idx
  on public.products (perf_capacity_l)
  where perf_capacity_l is not null;

notify pgrst, 'reload schema';
