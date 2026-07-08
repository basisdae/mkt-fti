-- Seed Product Classification tag catalog (six data-driven groups).
-- Safe to re-run: upserts on product_tag_groups.key and product_tags (group_id, value).
-- Does not delete existing groups, tags, or product_tag_links.

-- ---------------------------------------------------------------------------
-- Groups
-- ---------------------------------------------------------------------------

insert into public.product_tag_groups (id, name, key, sort_order, active)
values
  (gen_random_uuid(), 'Water Technology', 'water_technology', 0, true),
  (gen_random_uuid(), 'Output Function', 'output_function', 1, true),
  (gen_random_uuid(), 'Water Flow System', 'water_flow_system', 2, true),
  (gen_random_uuid(), 'Power System', 'power_system', 3, true),
  (gen_random_uuid(), 'Installation Type', 'installation_type', 4, true),
  (gen_random_uuid(), 'Application', 'application', 5, true)
on conflict (key) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  active = true,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Tags (lookup group_id by key; unique on (group_id, value))
-- ---------------------------------------------------------------------------

insert into public.product_tags (id, group_id, label, value, active, sort_order)
select gen_random_uuid(), g.id, v.label, v.value, true, v.sort_order
from public.product_tag_groups g
join (
  values
    -- Water Technology
    ('water_technology', 'RO', 'ro', 0),
    ('water_technology', 'UF', 'uf', 1),
    ('water_technology', 'NANO', 'nano', 2),
    ('water_technology', 'UV', 'uv', 3),
    ('water_technology', 'Carbon', 'carbon', 4),
    ('water_technology', 'Sediment', 'sediment', 5),
    ('water_technology', 'Softener', 'softener', 6),
    ('water_technology', 'Mineral', 'mineral', 7),
    ('water_technology', 'Alkaline', 'alkaline', 8),
    ('water_technology', 'Hydrogen', 'hydrogen', 9),
    ('water_technology', 'Other', 'other', 99),
    -- Output Function
    ('output_function', 'Hot', 'hot', 0),
    ('output_function', 'Ambient', 'ambient', 1),
    ('output_function', 'Cold', 'cold', 2),
    ('output_function', 'Ice', 'ice', 3),
    ('output_function', 'Sparkling', 'sparkling', 4),
    ('output_function', 'Flavor', 'flavor', 5),
    ('output_function', 'Other', 'other', 99),
    -- Water Flow System
    ('water_flow_system', 'Inlet', 'inlet', 0),
    ('water_flow_system', 'Outlet', 'outlet', 1),
    ('water_flow_system', 'Tank', 'tank', 2),
    ('water_flow_system', 'Tankless', 'tankless', 3),
    ('water_flow_system', 'Booster Pump', 'booster_pump', 4),
    ('water_flow_system', 'No Pump', 'no_pump', 5),
    ('water_flow_system', 'Other', 'other', 99),
    -- Power System
    ('power_system', 'Electric', 'electric', 0),
    ('power_system', 'Non Electric', 'non_electric', 1),
    ('power_system', 'Battery', 'battery', 2),
    ('power_system', 'USB Powered', 'usb_powered', 3),
    ('power_system', 'Other', 'other', 99),
    -- Installation Type
    ('installation_type', 'Countertop', 'countertop', 0),
    ('installation_type', 'Under Sink', 'under_sink', 1),
    ('installation_type', 'Wall Mount', 'wall_mount', 2),
    ('installation_type', 'Floor Standing', 'floor_standing', 3),
    ('installation_type', 'Built-in', 'built_in', 4),
    ('installation_type', 'Portable', 'portable', 5),
    ('installation_type', 'Faucet Mount', 'faucet_mount', 6),
    ('installation_type', 'Other', 'other', 99),
    -- Application
    ('application', 'Residential', 'residential', 0),
    ('application', 'Office', 'office', 1),
    ('application', 'Restaurant', 'restaurant', 2),
    ('application', 'Coffee Shop', 'coffee_shop', 3),
    ('application', 'Commercial', 'commercial', 4),
    ('application', 'Industrial', 'industrial', 5),
    ('application', 'Laboratory', 'laboratory', 6),
    ('application', 'Other', 'other', 99)
) as v(group_key, label, value, sort_order)
  on g.key = v.group_key
on conflict (group_id, value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = true,
  updated_at = now();

notify pgrst, 'reload schema';
