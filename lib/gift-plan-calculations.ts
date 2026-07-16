import type {
  GiftItemCategory,
  GiftPlanItemInput,
  GiftPlanItemRow,
  GiftPlanTierInput,
  GiftPlanTierRow,
} from "@/types/gift-plan";

export function safeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n < 0 ? 0 : n;
}

export interface GiftItemCalcInput {
  id: string;
  tier_id: string;
  category: GiftItemCategory;
  qty_per_customer: number;
  unit_actual_cost: number;
  estimated_gift_value_per_unit: number;
  purchase_group_id: string | null;
}

export interface GiftItemCalc extends GiftItemCalcInput {
  total_quantity: number;
  actual_cost_per_customer: number;
  estimated_value_per_customer: number;
  total_actual_cost: number;
  total_estimated_value: number;
}

export interface GiftTierCalcInput {
  id: string;
  customer_count: number;
  items: GiftItemCalcInput[];
}

export interface GiftTierCalc extends GiftTierCalcInput {
  items: GiftItemCalc[];
  actual_cost_per_customer: number;
  estimated_value_per_customer: number;
  total_actual_cost: number;
  total_estimated_value: number;
}

export interface GiftCampaignCalcInput {
  total_customer_sales: number;
  max_actual_cost_budget: number | null;
  budget_limit_percent: number | null;
  tiers: GiftTierCalcInput[];
}

export interface GiftCampaignCalc {
  total_customers: number;
  total_gift_units: number;
  total_campaign_actual_cost: number;
  total_campaign_estimated_value: number;
  total_voucher_actual_cost: number;
  total_premium_actual_cost: number;
  total_sales_gift_actual_cost: number;
  effective_max_budget: number | null;
  actual_gift_budget_percent: number | null;
  remaining_actual_cost_budget: number | null;
  tiers: GiftTierCalc[];
}

export interface PurchasingSummaryRow {
  group_key: string;
  purchase_group_id: string | null;
  gift_name: string;
  supplier: string | null;
  source: string;
  category: string;
  reference_url: string | null;
  operational_status: string | null;
  notes: string | null;
  total_required_qty: number;
  unit_actual_cost: number | "mixed";
  total_actual_cost: number;
  item_ids: string[];
  tier_names: string[];
}

export function calcGiftItem(
  item: GiftItemCalcInput,
  customerCount: number,
): GiftItemCalc {
  const qty = safeNumber(item.qty_per_customer);
  const unitCost = safeNumber(item.unit_actual_cost);
  const unitValue = safeNumber(item.estimated_gift_value_per_unit);
  const customers = safeNumber(customerCount);
  const totalQty = customers * qty;

  return {
    ...item,
    total_quantity: totalQty,
    actual_cost_per_customer: qty * unitCost,
    estimated_value_per_customer: qty * unitValue,
    total_actual_cost: totalQty * unitCost,
    total_estimated_value: totalQty * unitValue,
  };
}

export function calcGiftTier(tier: GiftTierCalcInput): GiftTierCalc {
  const customerCount = safeNumber(tier.customer_count);
  const items = tier.items.map((item) => calcGiftItem(item, customerCount));
  const actualPerCustomer = items.reduce(
    (sum, item) => sum + item.actual_cost_per_customer,
    0,
  );
  const estimatedPerCustomer = items.reduce(
    (sum, item) => sum + item.estimated_value_per_customer,
    0,
  );

  return {
    ...tier,
    items,
    actual_cost_per_customer: actualPerCustomer,
    estimated_value_per_customer: estimatedPerCustomer,
    total_actual_cost: customerCount * actualPerCustomer,
    total_estimated_value: customerCount * estimatedPerCustomer,
  };
}

export function calcGiftCampaign(input: GiftCampaignCalcInput): GiftCampaignCalc {
  const tiers = input.tiers.map(calcGiftTier);
  const totalCustomers = tiers.reduce(
    (sum, tier) => sum + safeNumber(tier.customer_count),
    0,
  );
  const totalGiftUnits = tiers.reduce(
    (sum, tier) =>
      sum + tier.items.reduce((inner, item) => inner + item.total_quantity, 0),
    0,
  );
  const totalActual = tiers.reduce((sum, tier) => sum + tier.total_actual_cost, 0);
  const totalEstimated = tiers.reduce(
    (sum, tier) => sum + tier.total_estimated_value,
    0,
  );

  const sumCategory = (category: GiftItemCategory) =>
    tiers.reduce(
      (sum, tier) =>
        sum +
        tier.items
          .filter((item) => item.category === category)
          .reduce((inner, item) => inner + item.total_actual_cost, 0),
      0,
    );

  const sales = safeNumber(input.total_customer_sales);
  const maxFromPercent =
    input.budget_limit_percent != null && sales > 0
      ? sales * (safeNumber(input.budget_limit_percent) / 100)
      : null;
  const effectiveMax =
    input.max_actual_cost_budget != null
      ? safeNumber(input.max_actual_cost_budget)
      : maxFromPercent;

  const budgetPercent =
    sales > 0 ? (totalActual / sales) * 100 : null;

  const remaining =
    effectiveMax != null ? effectiveMax - totalActual : null;

  return {
    total_customers: totalCustomers,
    total_gift_units: totalGiftUnits,
    total_campaign_actual_cost: totalActual,
    total_campaign_estimated_value: totalEstimated,
    total_voucher_actual_cost: sumCategory("gift_voucher"),
    total_premium_actual_cost: sumCategory("premium_gift"),
    total_sales_gift_actual_cost: sumCategory("sales_gift"),
    effective_max_budget: effectiveMax,
    actual_gift_budget_percent: budgetPercent,
    remaining_actual_cost_budget: remaining,
    tiers,
  };
}

export function buildPurchasingSummary(
  tiers: Array<{
    name: string;
    customer_count: number;
    items: Array<
      Pick<
        GiftPlanItemRow | GiftPlanItemInput,
        | "id"
        | "gift_name"
        | "category"
        | "source"
        | "qty_per_customer"
        | "unit_actual_cost"
        | "supplier"
        | "notes"
        | "purchase_group_id"
        | "reference_url"
        | "operational_status"
      >
    >;
  }>,
): PurchasingSummaryRow[] {
  const rows = new Map<string, PurchasingSummaryRow>();

  for (const tier of tiers) {
    const customerCount = safeNumber(tier.customer_count);
    for (const item of tier.items) {
      const groupKey = item.purchase_group_id ?? item.id;
      const totalQty = customerCount * safeNumber(item.qty_per_customer);
      const unitCost = safeNumber(item.unit_actual_cost);
      const totalCost = totalQty * unitCost;
      const existing = rows.get(groupKey);

      if (!existing) {
        rows.set(groupKey, {
          group_key: groupKey,
          purchase_group_id: item.purchase_group_id,
          gift_name: item.gift_name,
          supplier: item.supplier ?? null,
          source: item.source,
          category: item.category,
          reference_url: item.reference_url ?? null,
          operational_status: item.operational_status ?? null,
          notes: item.notes ?? null,
          total_required_qty: totalQty,
          unit_actual_cost: unitCost,
          total_actual_cost: totalCost,
          item_ids: [item.id],
          tier_names: [tier.name],
        });
        continue;
      }

      existing.total_required_qty += totalQty;
      existing.total_actual_cost += totalCost;
      existing.item_ids.push(item.id);
      if (!existing.tier_names.includes(tier.name)) {
        existing.tier_names.push(tier.name);
      }

      if (
        existing.unit_actual_cost !== "mixed" &&
        existing.unit_actual_cost !== unitCost
      ) {
        existing.unit_actual_cost = "mixed";
      }

      if (existing.supplier !== (item.supplier ?? null)) {
        existing.supplier = existing.supplier && item.supplier ? "See tier detail" : item.supplier ?? existing.supplier;
      }
    }
  }

  return [...rows.values()].sort((a, b) =>
    a.gift_name.localeCompare(b.gift_name),
  );
}

export function toCampaignCalcInput(
  plan: {
    total_customer_sales: number;
    max_actual_cost_budget: number | null;
    budget_limit_percent: number | null;
  },
  tiers: GiftPlanTierRow[],
  items: GiftPlanItemRow[],
): GiftCampaignCalcInput {
  const itemsByTier = new Map<string, GiftPlanItemRow[]>();
  for (const item of items) {
    const list = itemsByTier.get(item.tier_id) ?? [];
    list.push(item);
    itemsByTier.set(item.tier_id, list);
  }

  return {
    total_customer_sales: plan.total_customer_sales,
    max_actual_cost_budget: plan.max_actual_cost_budget,
    budget_limit_percent: plan.budget_limit_percent,
    tiers: tiers.map((tier) => ({
      id: tier.id,
      customer_count: tier.customer_count,
      items: (itemsByTier.get(tier.id) ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          id: item.id,
          tier_id: item.tier_id,
          category: item.category,
          qty_per_customer: item.qty_per_customer,
          unit_actual_cost: item.unit_actual_cost,
          estimated_gift_value_per_unit: item.estimated_gift_value_per_unit,
          purchase_group_id: item.purchase_group_id,
        })),
    })),
  };
}

export function toCampaignCalcInputFromEditor(
  payload: {
    plan: {
      total_customer_sales: number;
      max_actual_cost_budget: number | null;
      budget_limit_percent: number | null;
    };
    tiers: GiftPlanTierInput[];
  },
): GiftCampaignCalcInput {
  return {
    total_customer_sales: payload.plan.total_customer_sales,
    max_actual_cost_budget: payload.plan.max_actual_cost_budget,
    budget_limit_percent: payload.plan.budget_limit_percent,
    tiers: payload.tiers.map((tier) => ({
      id: tier.id,
      customer_count: tier.customer_count,
      items: tier.items.map((item) => ({
        id: item.id,
        tier_id: item.tier_id,
        category: item.category,
        qty_per_customer: item.qty_per_customer,
        unit_actual_cost: item.unit_actual_cost,
        estimated_gift_value_per_unit: item.estimated_gift_value_per_unit,
        purchase_group_id: item.purchase_group_id,
      })),
    })),
  };
}

export function normalizeTierName(name: string): string {
  return name.trim();
}

export function tierNamesConflict(
  tiers: Array<{ id: string; name: string }>,
  tierId: string,
  name: string,
): boolean {
  const normalized = normalizeTierName(name).toLowerCase();
  if (!normalized) return true;
  return tiers.some(
    (tier) =>
      tier.id !== tierId &&
      normalizeTierName(tier.name).toLowerCase() === normalized,
  );
}

export interface TierBudgetItemInput {
  qty_per_customer: number;
  estimated_gift_value_per_unit: number;
}

export interface TierBudgetCalcInput {
  estimated_total_sales: number | null;
  gift_budget_percent: number | null;
  estimated_customer_count: number | null;
  actual_customer_count: number;
  items: TierBudgetItemInput[];
}

export interface TierBudgetCalc {
  tier_budget_target: number | null;
  current_plan_value: number;
  current_plan_value_status: "value" | "unset" | "empty";
  actual_percent_of_sales: number | null;
  budget_remaining: number | null;
  budget_used_percent: number | null;
  is_over_budget: boolean;
  customer_count_for_avg: number;
  avg_budget_per_customer: number | null;
}

function divSafe(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return null;
  }
  if (denominator <= 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function calcTierCurrentPlanValue(
  items: TierBudgetItemInput[],
): { value: number; status: "value" | "unset" | "empty" } {
  if (items.length === 0) {
    return { value: 0, status: "empty" };
  }

  let hasQty = false;
  const value = items.reduce((sum, item) => {
    const qty = safeNumber(item.qty_per_customer);
    const unitValue = safeNumber(item.estimated_gift_value_per_unit);
    if (qty > 0) hasQty = true;
    return sum + qty * unitValue;
  }, 0);

  if (!hasQty) {
    return { value: 0, status: "unset" };
  }

  return { value, status: "value" };
}

export function resolveTierCustomerCountForAvg(input: {
  estimated_customer_count: number | null;
  actual_customer_count: number;
}): number {
  const actual = safeNumber(input.actual_customer_count);
  if (actual > 0) return actual;

  const estimated =
    input.estimated_customer_count != null
      ? safeNumber(input.estimated_customer_count)
      : 0;
  return estimated > 0 ? estimated : 0;
}

/** Actual customers from tier roster when available; 0 until a list module exists. */
export function resolveTierActualCustomerCount(_tierId: string): number {
  return 0;
}

export function calcTierBudget(input: TierBudgetCalcInput): TierBudgetCalc {
  const sales =
    input.estimated_total_sales != null
      ? safeNumber(input.estimated_total_sales)
      : null;
  const percent =
    input.gift_budget_percent != null
      ? safeNumber(input.gift_budget_percent)
      : null;

  const { value: currentPlanValue, status: currentPlanValueStatus } =
    calcTierCurrentPlanValue(input.items);

  const tierBudgetTarget =
    sales != null && sales > 0 && percent != null
      ? sales * (percent / 100)
      : null;

  const actualPercentOfSales =
    sales != null && sales > 0
      ? (divSafe(currentPlanValue, sales) ?? 0) * 100
      : null;

  const budgetRemaining =
    tierBudgetTarget != null ? tierBudgetTarget - currentPlanValue : null;

  const budgetUsedPercent =
    tierBudgetTarget != null && tierBudgetTarget > 0
      ? (divSafe(currentPlanValue, tierBudgetTarget) ?? 0) * 100
      : null;

  const customerCountForAvg = resolveTierCustomerCountForAvg({
    estimated_customer_count: input.estimated_customer_count,
    actual_customer_count: input.actual_customer_count,
  });

  const avgBudgetPerCustomer =
    tierBudgetTarget != null && customerCountForAvg > 0
      ? divSafe(tierBudgetTarget, customerCountForAvg)
      : null;

  return {
    tier_budget_target: tierBudgetTarget,
    current_plan_value: currentPlanValue,
    current_plan_value_status: currentPlanValueStatus,
    actual_percent_of_sales: actualPercentOfSales,
    budget_remaining: budgetRemaining,
    budget_used_percent: budgetUsedPercent,
    is_over_budget: budgetRemaining != null && budgetRemaining < 0,
    customer_count_for_avg: customerCountForAvg,
    avg_budget_per_customer: avgBudgetPerCustomer,
  };
}

export function toTierBudgetCalcInput(
  tier: Pick<
    GiftPlanTierInput,
    | "estimated_total_sales"
    | "gift_budget_percent"
    | "estimated_customer_count"
    | "items"
    | "id"
  >,
): TierBudgetCalcInput {
  return {
    estimated_total_sales: tier.estimated_total_sales,
    gift_budget_percent: tier.gift_budget_percent,
    estimated_customer_count: tier.estimated_customer_count,
    actual_customer_count: resolveTierActualCustomerCount(tier.id),
    items: tier.items.map((item) => ({
      qty_per_customer: item.qty_per_customer,
      estimated_gift_value_per_unit: item.estimated_gift_value_per_unit,
    })),
  };
}
