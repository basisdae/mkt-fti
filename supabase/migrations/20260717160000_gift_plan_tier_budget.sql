-- Per-tier gift budget planning (estimated sales × budget %)
alter table public.gift_plan_tiers
  add column if not exists estimated_total_sales numeric(18, 4),
  add column if not exists gift_budget_percent numeric(10, 6),
  add column if not exists estimated_customer_count integer;

comment on column public.gift_plan_tiers.estimated_total_sales is
  'Approximate total sales for this tier (used for gift budget target).';
comment on column public.gift_plan_tiers.gift_budget_percent is
  'Gift budget as percent of estimated sales, e.g. 0.2 = 0.20%.';
comment on column public.gift_plan_tiers.estimated_customer_count is
  'Optional approximate customer count for per-customer budget display.';

alter table public.gift_plan_tiers
  drop constraint if exists gift_plan_tiers_estimated_total_sales_chk;
alter table public.gift_plan_tiers
  add constraint gift_plan_tiers_estimated_total_sales_chk
    check (estimated_total_sales is null or estimated_total_sales >= 0);

alter table public.gift_plan_tiers
  drop constraint if exists gift_plan_tiers_gift_budget_percent_chk;
alter table public.gift_plan_tiers
  add constraint gift_plan_tiers_gift_budget_percent_chk
    check (gift_budget_percent is null or gift_budget_percent >= 0);

alter table public.gift_plan_tiers
  drop constraint if exists gift_plan_tiers_estimated_customer_count_chk;
alter table public.gift_plan_tiers
  add constraint gift_plan_tiers_estimated_customer_count_chk
    check (estimated_customer_count is null or estimated_customer_count >= 0);
