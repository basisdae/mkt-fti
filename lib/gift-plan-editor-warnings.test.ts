import assert from "node:assert/strict";
import { deriveGiftPlanEditorWarnings } from "@/lib/gift-plan-editor-warnings";
import type { GiftPlanEditorPayload } from "@/types/gift-plan";

const base: GiftPlanEditorPayload = {
  plan: {
    id: "plan-1",
    name: "FY26",
    campaign_year: 2026,
    campaign_headline: "",
    description: "",
    owner: "MKT",
    status: "draft",
    total_customer_sales: 0,
    max_actual_cost_budget: null,
    budget_limit_percent: null,
    campaign_conditions: "",
    approval_notes: "",
    is_archived: false,
  },
  tiers: [],
  purchase_groups: [],
  expected_updated_at: "2026-01-01T00:00:00Z",
};

const dirtyWarnings = deriveGiftPlanEditorWarnings(base, true);
assert.ok(dirtyWarnings.some((row) => row.id === "unsaved"));
assert.ok(dirtyWarnings.some((row) => row.id === "no-tiers"));

const cleanWarnings = deriveGiftPlanEditorWarnings(base, false);
assert.ok(!cleanWarnings.some((row) => row.id === "unsaved"));

console.log("gift-plan-editor-warnings.test.ts: all assertions passed");
