import assert from "node:assert/strict";
import {
  GIFT_PLAN_COMMUNICATION_FORBIDDEN_COLUMNS,
  GIFT_PLAN_COMMUNICATION_VIEW_COLUMNS,
} from "@/lib/gift-plan-communication-views";

for (const [viewName, columns] of Object.entries(
  GIFT_PLAN_COMMUNICATION_VIEW_COLUMNS,
)) {
  for (const forbidden of GIFT_PLAN_COMMUNICATION_FORBIDDEN_COLUMNS) {
    assert.equal(
      columns.includes(forbidden as never),
      false,
      `${viewName} must not expose ${forbidden}`,
    );
  }
}

assert.equal(GIFT_PLAN_COMMUNICATION_VIEW_COLUMNS.gift_plans_communication_v.length > 0, true);
assert.equal(
  GIFT_PLAN_COMMUNICATION_VIEW_COLUMNS.gift_plan_items_communication_v.includes(
    "unit_actual_cost" as never,
  ),
  false,
);

console.log("gift-plan-communication-views.test.ts: all assertions passed");
