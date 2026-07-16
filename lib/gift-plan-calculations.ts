import type {
  GiftItemCategory,
  GiftPlanEditorPayload,
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
  purchase_group_id: string;
  gift_name: string;
  specification: string | null;
  supplier: string | null;
  source: string;
  category: string;
  reference_url: string | null;
  operational_status: string | null;
  notes: string | null;
  base_required_qty: number;
  base_required_qty_status: "ready" | "partial" | "pending";
  tiers_missing_customers: string[];
  buffer_percentage: number;
  buffer_qty: number;
  final_required_qty: number;
  is_provisional_qty: boolean;
  unit_actual_cost: number | "mixed";
  base_actual_cost: number;
  buffer_actual_cost: number;
  final_purchase_cost: number;
  item_ids: string[];
  tier_names: string[];
  tier_breakdown: Array<{
    tier_name: string;
    customer_count: number;
    qty_per_customer: number;
    line_qty: number;
    has_customers: boolean;
  }>;
  warnings: string[];
}

export type TierTotalStatus = "ready" | "pending_customers";

export interface GiftTierCalcExtended extends GiftTierCalc {
  gift_units_per_customer: number;
  total_actual_cost_status: TierTotalStatus;
  total_estimated_value_status: TierTotalStatus;
  gift_cost_percent_of_sales: number | null;
  value_cost_gap_per_customer: number;
}

export interface TierComparisonRow {
  tier_id: string;
  tier_name: string;
  sales_threshold: number | null;
  sales_threshold_label: string;
  customer_count: number | null;
  customer_count_status: "ready" | "pending";
  item_count: number;
  actual_per_customer: number;
  estimated_per_customer: number;
  total_actual_cost: number | null;
  total_estimated_value: number | null;
  total_status: TierTotalStatus;
  gift_cost_percent_of_sales: number | null;
  warnings: string[];
}

export interface CampaignPurchasingTotals {
  base_gift_units: number;
  buffer_gift_units: number;
  final_gift_units: number;
  plan_actual_cost: number;
  buffer_actual_cost: number;
  final_purchase_cost: number;
  has_provisional_qty: boolean;
}

export function tierHasCustomerCount(customerCount: number): boolean {
  return safeNumber(customerCount) > 0;
}

export function calcBufferQuantity(
  baseQty: number,
  bufferPercent: number,
): number {
  const base = safeNumber(baseQty);
  const percent = safeNumber(bufferPercent);
  if (base <= 0 || percent <= 0) return 0;
  const raw = (base * percent) / 100;
  return Number.isFinite(raw) ? Math.ceil(raw) : 0;
}

export function calcGiftTierExtended(
  tier: GiftTierCalcInput & {
    name?: string;
    sales_threshold?: number | null;
    estimated_total_sales?: number | null;
  },
): GiftTierCalcExtended {
  const base = calcGiftTier(tier);
  const hasCustomers = tierHasCustomerCount(tier.customer_count);
  const giftUnitsPerCustomer = base.items.reduce(
    (sum, item) => sum + safeNumber(item.qty_per_customer),
    0,
  );
  const sales =
    tier.estimated_total_sales != null
      ? safeNumber(tier.estimated_total_sales)
      : null;
  const giftCostPercent =
    sales != null && sales > 0 && hasCustomers
      ? ((divSafe(base.total_actual_cost, sales) ?? 0) * 100)
      : sales != null && sales > 0 && !hasCustomers
        ? ((divSafe(base.actual_cost_per_customer, sales) ?? 0) * 100)
        : null;

  return {
    ...base,
    gift_units_per_customer: giftUnitsPerCustomer,
    total_actual_cost_status: hasCustomers ? "ready" : "pending_customers",
    total_estimated_value_status: hasCustomers ? "ready" : "pending_customers",
    gift_cost_percent_of_sales: giftCostPercent,
    value_cost_gap_per_customer:
      base.estimated_value_per_customer - base.actual_cost_per_customer,
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
        | "specification"
      >
    >;
  }>,
  purchaseGroups: Array<{ id: string; buffer_percentage: number }> = [],
): PurchasingSummaryRow[] {
  const bufferByGroup = new Map(
    purchaseGroups.map((group) => [
      group.id,
      safeNumber(group.buffer_percentage),
    ]),
  );
  const rows = new Map<string, PurchasingSummaryRow>();

  for (const tier of tiers) {
    const customerCount = safeNumber(tier.customer_count);
    const hasCustomers = tierHasCustomerCount(customerCount);

    for (const item of tier.items) {
      if (!item.purchase_group_id) continue;

      const groupKey = item.purchase_group_id;
      const lineQty = hasCustomers
        ? customerCount * safeNumber(item.qty_per_customer)
        : 0;
      const unitCost = safeNumber(item.unit_actual_cost);
      const lineCost = lineQty * unitCost;
      const existing = rows.get(groupKey);

      if (!existing) {
        const bufferPercent = bufferByGroup.get(groupKey) ?? 0;
        rows.set(groupKey, {
          group_key: groupKey,
          purchase_group_id: groupKey,
          gift_name: item.gift_name,
          specification: item.specification ?? null,
          supplier: item.supplier ?? null,
          source: item.source,
          category: item.category,
          reference_url: item.reference_url ?? null,
          operational_status: item.operational_status ?? null,
          notes: item.notes ?? null,
          base_required_qty: lineQty,
          base_required_qty_status: hasCustomers ? "ready" : "pending",
          tiers_missing_customers: hasCustomers ? [] : [tier.name],
          buffer_percentage: bufferPercent,
          buffer_qty: 0,
          final_required_qty: 0,
          is_provisional_qty: !hasCustomers,
          unit_actual_cost: unitCost,
          base_actual_cost: lineCost,
          buffer_actual_cost: 0,
          final_purchase_cost: 0,
          item_ids: [item.id],
          tier_names: [tier.name],
          tier_breakdown: [
            {
              tier_name: tier.name,
              customer_count: customerCount,
              qty_per_customer: safeNumber(item.qty_per_customer),
              line_qty: lineQty,
              has_customers: hasCustomers,
            },
          ],
          warnings: hasCustomers ? [] : [`${tier.name}: รอจำนวนลูกค้า`],
        });
        continue;
      }

      existing.base_required_qty += lineQty;
      existing.base_actual_cost += lineCost;
      existing.item_ids.push(item.id);
      if (!existing.tier_names.includes(tier.name)) {
        existing.tier_names.push(tier.name);
      }
      existing.tier_breakdown.push({
        tier_name: tier.name,
        customer_count: customerCount,
        qty_per_customer: safeNumber(item.qty_per_customer),
        line_qty: lineQty,
        has_customers: hasCustomers,
      });

      if (!hasCustomers && !existing.tiers_missing_customers.includes(tier.name)) {
        existing.tiers_missing_customers.push(tier.name);
        existing.warnings.push(`${tier.name}: รอจำนวนลูกค้า`);
        existing.is_provisional_qty = true;
        existing.base_required_qty_status = "partial";
      }

      if (
        existing.unit_actual_cost !== "mixed" &&
        existing.unit_actual_cost !== unitCost
      ) {
        existing.unit_actual_cost = "mixed";
      }

      if (existing.supplier !== (item.supplier ?? null)) {
        existing.supplier =
          existing.supplier && item.supplier
            ? "See tier detail"
            : (item.supplier ?? existing.supplier);
      }
    }
  }

  for (const row of rows.values()) {
    if (row.tiers_missing_customers.length > 0 && row.base_required_qty > 0) {
      row.base_required_qty_status = "partial";
      row.is_provisional_qty = true;
    } else if (row.tiers_missing_customers.length > 0) {
      row.base_required_qty_status = "pending";
      row.is_provisional_qty = true;
    } else {
      row.base_required_qty_status = "ready";
      row.is_provisional_qty = false;
    }

    row.buffer_qty = calcBufferQuantity(
      row.base_required_qty,
      row.buffer_percentage,
    );
    row.final_required_qty = row.base_required_qty + row.buffer_qty;

    const unit =
      row.unit_actual_cost === "mixed" ? 0 : safeNumber(row.unit_actual_cost);
    row.buffer_actual_cost = row.buffer_qty * unit;
    row.final_purchase_cost = row.base_actual_cost + row.buffer_actual_cost;
  }

  return [...rows.values()].sort((a, b) =>
    a.gift_name.localeCompare(b.gift_name),
  );
}

export function buildTierComparison(
  payload: {
    plan: { total_customer_sales: number };
    tiers: GiftPlanTierInput[];
  },
): TierComparisonRow[] {
  return [...payload.tiers]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((tier) => {
      const calc = calcGiftTierExtended({
        id: tier.id,
        customer_count: tier.customer_count,
        estimated_total_sales: tier.estimated_total_sales,
        items: tier.items.map((item) => ({
          id: item.id,
          tier_id: item.tier_id,
          category: item.category,
          qty_per_customer: item.qty_per_customer,
          unit_actual_cost: item.unit_actual_cost,
          estimated_gift_value_per_unit: item.estimated_gift_value_per_unit,
          purchase_group_id: item.purchase_group_id,
        })),
      });

      const warnings: string[] = [];
      if (tier.items.length === 0) warnings.push("no_gifts");
      if (!tierHasCustomerCount(tier.customer_count)) {
        warnings.push("pending_customers");
      }
      if (calc.gift_cost_percent_of_sales != null && calc.gift_cost_percent_of_sales > 5) {
        warnings.push("high_cost_ratio");
      }

      const hasCustomers = tierHasCustomerCount(tier.customer_count);

      return {
        tier_id: tier.id,
        tier_name: tier.name,
        sales_threshold: tier.sales_threshold,
        sales_threshold_label: tier.sales_threshold_label,
        customer_count: hasCustomers ? tier.customer_count : null,
        customer_count_status: hasCustomers ? "ready" : "pending",
        item_count: tier.items.length,
        actual_per_customer: calc.actual_cost_per_customer,
        estimated_per_customer: calc.estimated_value_per_customer,
        total_actual_cost: hasCustomers ? calc.total_actual_cost : null,
        total_estimated_value: hasCustomers ? calc.total_estimated_value : null,
        total_status: calc.total_actual_cost_status,
        gift_cost_percent_of_sales: calc.gift_cost_percent_of_sales,
        warnings,
      };
    });
}

export function calcCampaignPurchasingTotals(
  rows: PurchasingSummaryRow[],
): CampaignPurchasingTotals {
  return rows.reduce<CampaignPurchasingTotals>(
    (acc, row) => ({
      base_gift_units: acc.base_gift_units + row.base_required_qty,
      buffer_gift_units: acc.buffer_gift_units + row.buffer_qty,
      final_gift_units: acc.final_gift_units + row.final_required_qty,
      plan_actual_cost: acc.plan_actual_cost + row.base_actual_cost,
      buffer_actual_cost: acc.buffer_actual_cost + row.buffer_actual_cost,
      final_purchase_cost: acc.final_purchase_cost + row.final_purchase_cost,
      has_provisional_qty: acc.has_provisional_qty || row.is_provisional_qty,
    }),
    {
      base_gift_units: 0,
      buffer_gift_units: 0,
      final_gift_units: 0,
      plan_actual_cost: 0,
      buffer_actual_cost: 0,
      final_purchase_cost: 0,
      has_provisional_qty: false,
    },
  );
}

export function buildPurchasingInputFromEditor(payload: GiftPlanEditorPayload) {
  return {
    tiers: payload.tiers.map((tier) => ({
      name: tier.name,
      customer_count: tier.customer_count,
      items: tier.items,
    })),
    purchaseGroups: payload.purchase_groups.map((group) => ({
      id: group.id,
      buffer_percentage: group.buffer_percentage,
    })),
  };
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
