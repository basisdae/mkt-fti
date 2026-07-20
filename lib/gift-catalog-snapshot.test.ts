import assert from "node:assert/strict";
import { applyCatalogToPlanItem } from "@/lib/gift-catalog-snapshot";
import type { GiftCatalogRow } from "@/types/gift-catalog";

const catalog: GiftCatalogRow = {
  id: "cat-1",
  gift_name: "Premium Mug",
  internal_code: "MUG-01",
  category: "premium_gift",
  source: "external_purchase",
  description: "Corporate mug",
  unit: "pcs",
  default_actual_cost: 120,
  default_estimated_gift_value: 250,
  supplier_name: "Acme Gifts",
  specification: "Ceramic 350ml",
  notes: "Logo print included",
  image_url: null,
  image_path: null,
  reference_url: null,
  operational_status: "interested",
  status: "active",
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  created_by_email: null,
  updated_by_email: null,
};

const { item, group } = applyCatalogToPlanItem(catalog, "plan-1", "tier-1", 0, {
  qty_per_customer: 2,
});

assert.equal(item.gift_catalog_id, "cat-1");
assert.equal(item.tier_id, "tier-1");
assert.equal(item.gift_name, "Premium Mug");
assert.equal(item.qty_per_customer, 2);
assert.equal(item.unit_actual_cost, 120);
assert.equal(item.estimated_gift_value_per_unit, 250);
assert.equal(item.supplier, "Acme Gifts");
assert.equal(item.specification, "Ceramic 350ml");
assert.equal(item.notes, "Logo print included");
assert.ok(item.purchase_group_id);
assert.equal(item.purchase_group_id, group.id);
assert.equal(group.buffer_percentage, 0);

console.log("gift-catalog-snapshot.test.ts: all assertions passed");
