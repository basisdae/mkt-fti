import assert from "node:assert/strict";
import {
  buildPurchasingSummary,
  calcGiftCampaign,
  calcGiftItem,
  calcGiftTier,
  safeNumber,
  tierNamesConflict,
} from "@/lib/gift-plan-calculations";

function testSafeNumber() {
  assert.equal(safeNumber(5), 5);
  assert.equal(safeNumber("3.5"), 3.5);
  assert.equal(safeNumber(NaN), 0);
  assert.equal(safeNumber(-2), 0);
}

function testGiftItemCalc() {
  const result = calcGiftItem(
    {
      id: "i1",
      tier_id: "t1",
      category: "premium_gift",
      qty_per_customer: 2,
      unit_actual_cost: 100,
      estimated_gift_value_per_unit: 150,
      purchase_group_id: null,
    },
    10,
  );
  assert.equal(result.total_quantity, 20);
  assert.equal(result.actual_cost_per_customer, 200);
  assert.equal(result.estimated_value_per_customer, 300);
  assert.equal(result.total_actual_cost, 2000);
  assert.equal(result.total_estimated_value, 3000);
}

function testGiftTierCalc() {
  const tier = calcGiftTier({
    id: "t1",
    customer_count: 5,
    items: [
      {
        id: "i1",
        tier_id: "t1",
        category: "gift_voucher",
        qty_per_customer: 1,
        unit_actual_cost: 50,
        estimated_gift_value_per_unit: 50,
        purchase_group_id: null,
      },
      {
        id: "i2",
        tier_id: "t1",
        category: "premium_gift",
        qty_per_customer: 2,
        unit_actual_cost: 100,
        estimated_gift_value_per_unit: 120,
        purchase_group_id: null,
      },
    ],
  });
  assert.equal(tier.actual_cost_per_customer, 250);
  assert.equal(tier.total_actual_cost, 1250);
}

function testCampaignBudgetPercent() {
  const campaign = calcGiftCampaign({
    total_customer_sales: 1_000_000,
    max_actual_cost_budget: null,
    budget_limit_percent: 1,
    tiers: [
      {
        id: "t1",
        customer_count: 10,
        items: [
          {
            id: "i1",
            tier_id: "t1",
            category: "sales_gift",
            qty_per_customer: 1,
            unit_actual_cost: 500,
            estimated_gift_value_per_unit: 600,
            purchase_group_id: null,
          },
        ],
      },
    ],
  });
  assert.equal(campaign.total_campaign_actual_cost, 5000);
  assert.equal(campaign.effective_max_budget, 10_000);
  assert.equal(campaign.actual_gift_budget_percent, 0.5);
  assert.equal(campaign.remaining_actual_cost_budget, 5000);
}

function testPurchasingSummaryGrouping() {
  const rows = buildPurchasingSummary([
    {
      name: "Tier A",
      customer_count: 10,
      items: [
        {
          id: "i1",
          gift_name: "Bag",
          category: "premium_gift",
          source: "marketing",
          qty_per_customer: 1,
          unit_actual_cost: 80,
          supplier: "Vendor A",
          notes: "Spec A",
          purchase_group_id: "g1",
        },
      ],
    },
    {
      name: "Tier B",
      customer_count: 5,
      items: [
        {
          id: "i2",
          gift_name: "Bag",
          category: "premium_gift",
          source: "marketing",
          qty_per_customer: 1,
          unit_actual_cost: 80,
          supplier: "Vendor A",
          notes: "Spec A",
          purchase_group_id: "g1",
        },
      ],
    },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.total_required_qty, 15);
  assert.equal(rows[0]?.total_actual_cost, 1200);
}

function testTierNameConflict() {
  const tiers = [
    { id: "a", name: "Gold" },
    { id: "b", name: " silver " },
  ];
  assert.equal(tierNamesConflict(tiers, "c", "SILVER"), true);
  assert.equal(tierNamesConflict(tiers, "b", "Silver"), false);
}

export function runGiftPlanCalculationTests() {
  testSafeNumber();
  testGiftItemCalc();
  testGiftTierCalc();
  testCampaignBudgetPercent();
  testPurchasingSummaryGrouping();
  testTierNameConflict();
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1]?.includes("gift-plan-calculations.test");

if (isDirectRun) {
  runGiftPlanCalculationTests();
  console.log("gift-plan-calculations: all tests passed");
}
