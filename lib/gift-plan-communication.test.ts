import assert from "node:assert/strict";
import {
  assertCommunicationReportSafe,
  buildCommunicationReport,
  buildPublicConditions,
  formatGiftDisplayLine,
  voucherValueForItem,
} from "@/lib/gift-plan-communication";
import type { GiftPlanEditorBundle } from "@/types/gift-plan";

const sampleBundle: GiftPlanEditorBundle = {
  plan: {
    id: "plan-1",
    name: "Dealer Gift 2027",
    campaign_year: 2027,
    campaign_headline: "Thank You Campaign",
    description: "Annual dealer appreciation",
    owner: "MKT HQ",
    status: "approved",
    total_customer_sales: 100_000_000,
    max_actual_cost_budget: 500_000,
    budget_limit_percent: 0.5,
    campaign_conditions: "Valid through Dec 2027",
    approval_notes: "Internal only",
    is_archived: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    last_saved_at: "2026-01-01T00:00:00Z",
    created_by_email: "mkt@fti.co.th",
    updated_by_email: "mkt@fti.co.th",
  },
  tiers: [
    {
      id: "tier-ss",
      plan_id: "plan-1",
      name: "SS",
      sort_order: 0,
      sales_threshold: 20_000_000,
      sales_threshold_label: "20,000,000+",
      customer_count: 10,
      notes: "Top tier",
      gift_policy: "One set per customer",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
  items: [
    {
      id: "item-voucher",
      tier_id: "tier-ss",
      sort_order: 0,
      gift_name: "Gift Voucher",
      category: "gift_voucher",
      source: "marketing",
      qty_per_customer: 1,
      unit_actual_cost: 8000,
      estimated_gift_value_per_unit: 10_000,
      supplier: "Internal Vendor",
      notes: null,
      purchase_group_id: null,
      gift_catalog_id: null,
      specification: "",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "item-bag",
      tier_id: "tier-ss",
      sort_order: 1,
      gift_name: "Tote Bag",
      category: "premium_gift",
      source: "marketing",
      qty_per_customer: 40,
      unit_actual_cost: 50,
      estimated_gift_value_per_unit: 100,
      supplier: "Bag Co",
      notes: null,
      purchase_group_id: null,
      gift_catalog_id: null,
      specification: "",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ],
  purchase_groups: [],
};

function testDisplayLine() {
  assert.equal(formatGiftDisplayLine("Tote Bag", 40), "Tote Bag × 40");
  assert.equal(formatGiftDisplayLine("Certificate", 1), "Certificate");
}

function testVoucherValue() {
  assert.equal(voucherValueForItem("gift_voucher", 10000), 10000);
  assert.equal(voucherValueForItem("premium_gift", 10000), null);
}

function testCommunicationReport() {
  const report = buildCommunicationReport(sampleBundle);
  assert.equal(report.campaign_name, "Dealer Gift 2027");
  assert.equal(report.tiers.length, 1);
  assert.equal(report.tiers[0]?.tier_voucher_value, 10_000);
  assert.equal(report.tiers[0]?.items.length, 2);
  assert.equal(report.tiers[0]?.total_estimated_value_per_customer, 14_000);
  assertCommunicationReportSafe(report);

  const json = JSON.stringify(report);
  assert.equal(json.includes("approval_notes"), false);
  assert.equal(json.includes("unit_actual_cost"), false);
  assert.equal(json.includes("supplier"), false);
}

function testPublicConditions() {
  const text = buildPublicConditions("Campaign rule", "Tier note", "Policy");
  assert.match(text, /Campaign rule/);
  assert.match(text, /Tier note/);
}

export function runGiftPlanCommunicationTests() {
  testDisplayLine();
  testVoucherValue();
  testCommunicationReport();
  testPublicConditions();
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1]?.includes("gift-plan-communication.test");

if (isDirectRun) {
  runGiftPlanCommunicationTests();
  console.log("gift-plan-communication: all tests passed");
}
