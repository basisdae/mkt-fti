import assert from "node:assert/strict";
import {
  deriveTierTabMeta,
  itemsInTierForCatalog,
  sortedTiers,
} from "@/lib/gift-plan-tier-navigation";
import type { GiftPlanEditorPayload } from "@/types/gift-plan";

const payload: GiftPlanEditorPayload = {
  plan: {
    id: "plan-1",
    name: "FY26 Gifts",
    campaign_year: 2026,
    campaign_headline: "",
    description: "",
    owner: "MKT",
    status: "draft",
    total_customer_sales: 0,
    max_actual_cost_budget: 1000,
    budget_limit_percent: null,
    campaign_conditions: "",
    approval_notes: "",
    is_archived: false,
  },
  tiers: [
    {
      id: "tier-a",
      plan_id: "plan-1",
      name: "Gold",
      sort_order: 1,
      sales_threshold: null,
      sales_threshold_label: "",
      customer_count: 10,
      notes: "",
      gift_policy: "",
      items: [
        {
          id: "item-1",
          tier_id: "tier-a",
          sort_order: 0,
          gift_catalog_id: "cat-1",
          gift_name: "Mug",
          category: "premium_gift",
          source: "external_purchase",
          qty_per_customer: 1,
          unit_actual_cost: 50,
          estimated_gift_value_per_unit: 100,
          supplier: null,
          specification: "",
          notes: null,
          purchase_group_id: null,
        },
      ],
    },
    {
      id: "tier-b",
      plan_id: "plan-1",
      name: "Silver",
      sort_order: 0,
      sales_threshold: null,
      sales_threshold_label: "",
      customer_count: 0,
      notes: "",
      gift_policy: "",
      items: [],
    },
  ],
  purchase_groups: [],
  expected_updated_at: "2026-01-01T00:00:00Z",
};

const tabs = deriveTierTabMeta(payload);
assert.equal(tabs.length, 2);
assert.equal(sortedTiers(payload)[0]?.id, "tier-b");
assert.ok(tabs.some((tab) => tab.id === "tier-a" && tab.itemCount === 1));
assert.ok(tabs.some((tab) => tab.id === "tier-b" && tab.warnings.includes("no_gifts")));

const existing = itemsInTierForCatalog(payload, "tier-a", "cat-1");
assert.equal(existing.length, 1);

console.log("gift-plan-tier-navigation.test.ts: all assertions passed");
