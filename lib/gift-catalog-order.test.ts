import assert from "node:assert/strict";
import {
  applyVisibleCatalogReorder,
  catalogHasActiveFilters,
  sortCatalogByManualOrder,
} from "@/lib/gift-catalog-order";
import type { GiftCatalogRow } from "@/types/gift-catalog";

function row(
  id: string,
  sort_order: number,
  status: GiftCatalogRow["status"] = "active",
): GiftCatalogRow {
  return {
    id,
    gift_name: id,
    internal_code: null,
    category: "premium_gift",
    source: "external_purchase",
    description: "",
    image_url: null,
    image_path: null,
    reference_url: null,
    unit: "pcs",
    default_actual_cost: 0,
    default_estimated_gift_value: 0,
    supplier_name: null,
    specification: "",
    notes: "",
    status,
    operational_status: "interested",
    sort_order,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_by_email: null,
    updated_by_email: null,
  };
}

const all = [row("a", 0), row("b", 1), row("c", 2), row("d", 3, "archived")];

assert.deepEqual(
  applyVisibleCatalogReorder(all, [row("c", 2), row("a", 0), row("b", 1)]).map(
    (item) => item.id,
  ),
  ["c", "a", "b", "d"],
);

assert.deepEqual(
  applyVisibleCatalogReorder(all, [row("b", 1), row("a", 0)]).map((item) => item.id),
  ["b", "a", "c", "d"],
);

assert.equal(
  sortCatalogByManualOrder([row("c", 2), row("a", 0), row("b", 1)]).map((i) => i.id).join(","),
  "a,b,c",
);

assert.equal(
  catalogHasActiveFilters({
    query: "",
    category: "all",
    source: "all",
    status: "all",
    operational: "all",
  }),
  false,
);

assert.equal(
  catalogHasActiveFilters({
    query: "mug",
    category: "all",
    source: "all",
    status: "all",
    operational: "all",
  }),
  true,
);

console.log("gift-catalog-order.test.ts: all assertions passed");
