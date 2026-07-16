import { calcGiftItem, safeNumber } from "@/lib/gift-plan-calculations";
import type {
  GiftItemCategory,
  GiftPlanEditorBundle,
  GiftPlanCommunicationReport,
  GiftPlanCommunicationTier,
  GiftPlanCommunicationItem,
} from "@/types/gift-plan";

export function formatGiftDisplayLine(
  giftName: string,
  qtyPerCustomer: number,
): string {
  const qty = safeNumber(qtyPerCustomer);
  if (qty <= 1) return giftName.trim();
  const formatted =
    qty % 1 === 0
      ? qty.toLocaleString()
      : qty.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return `${giftName.trim()} × ${formatted}`;
}

export function voucherValueForItem(
  category: GiftItemCategory,
  estimatedGiftValuePerUnit: number,
): number | null {
  if (category !== "gift_voucher") return null;
  const value = safeNumber(estimatedGiftValuePerUnit);
  return value > 0 ? value : null;
}

export function buildPublicConditions(
  campaignConditions: string,
  tierNotes: string,
  giftPolicy: string,
): string {
  const parts = [
    campaignConditions.trim(),
    tierNotes.trim(),
    giftPolicy.trim(),
  ].filter(Boolean);
  return parts.join("\n\n");
}

/** Build a Sales Communication Report from a saved plan bundle. */
export function buildCommunicationReport(
  bundle: GiftPlanEditorBundle,
  generatedAt = new Date(),
): GiftPlanCommunicationReport {
  const itemsByTier = new Map<string, typeof bundle.items>();
  for (const item of bundle.items) {
    const list = itemsByTier.get(item.tier_id) ?? [];
    list.push(item);
    itemsByTier.set(item.tier_id, list);
  }

  const tiers: GiftPlanCommunicationTier[] = bundle.tiers
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((tier) => {
      const tierItems = (itemsByTier.get(tier.id) ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      );

      let totalEstimatedPerCustomer = 0;
      let tierVoucherValue: number | null = null;

      const items: GiftPlanCommunicationItem[] = tierItems.map((item) => {
        const calc = calcGiftItem(
          {
            id: item.id,
            tier_id: item.tier_id,
            category: item.category,
            qty_per_customer: Number(item.qty_per_customer),
            unit_actual_cost: 0,
            estimated_gift_value_per_unit: Number(item.estimated_gift_value_per_unit),
            purchase_group_id: null,
          },
          1,
        );

        totalEstimatedPerCustomer += calc.estimated_value_per_customer;

        const voucher = voucherValueForItem(
          item.category,
          Number(item.estimated_gift_value_per_unit),
        );
        if (voucher != null && tierVoucherValue == null) {
          tierVoucherValue = voucher;
        }

        return {
          gift_name: item.gift_name,
          category: item.category,
          qty_per_customer: Number(item.qty_per_customer),
          voucher_value: voucher,
          estimated_gift_value_per_unit: Number(item.estimated_gift_value_per_unit),
          estimated_value_per_customer: calc.estimated_value_per_customer,
          display_line: formatGiftDisplayLine(
            item.gift_name,
            Number(item.qty_per_customer),
          ),
        };
      });

      return {
        id: tier.id,
        name: tier.name,
        sort_order: tier.sort_order,
        sales_threshold:
          tier.sales_threshold != null ? Number(tier.sales_threshold) : null,
        sales_threshold_label: tier.sales_threshold_label,
        items,
        tier_voucher_value: tierVoucherValue,
        total_estimated_value_per_customer: totalEstimatedPerCustomer,
        gift_policy: tier.gift_policy,
        notes: tier.notes,
        public_conditions: buildPublicConditions(
          bundle.plan.campaign_conditions,
          tier.notes,
          tier.gift_policy,
        ),
      };
    });

  return {
    plan_id: bundle.plan.id,
    campaign_name: bundle.plan.name,
    campaign_year: bundle.plan.campaign_year,
    campaign_headline: bundle.plan.campaign_headline ?? "",
    campaign_description: bundle.plan.description,
    campaign_conditions: bundle.plan.campaign_conditions,
    generated_at: generatedAt.toISOString(),
    tiers,
  };
}

/** Guard: communication report must never expose internal fields. */
export function assertCommunicationReportSafe(
  report: GiftPlanCommunicationReport,
): void {
  const forbiddenKeys = [
    "unit_actual_cost",
    "total_actual_cost",
    "supplier",
    "approval_notes",
    "max_actual_cost_budget",
    "budget_limit_percent",
    "total_customer_sales",
    "purchase_group_id",
  ];
  const json = JSON.stringify(report).toLowerCase();
  for (const key of forbiddenKeys) {
    if (json.includes(`"${key}"`)) {
      throw new Error(`Communication report leaked forbidden field: ${key}`);
    }
  }
}
