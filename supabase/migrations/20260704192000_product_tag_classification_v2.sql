-- Product classification v2: six data-driven tag groups.
-- Tables are created in 20260704190000_product_tags.sql.
-- This migration deactivates legacy groups; app seed inserts new defaults.

update public.product_tag_groups
set active = false,
    updated_at = now()
where key in ('filter_system', 'function', 'in_out_system');

notify pgrst, 'reload schema';
