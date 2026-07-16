"use client";

import { buildPurchasingSummary } from "@/lib/gift-plan-calculations";
import { formatGiftMoney, formatGiftPercent, formatGiftQty } from "@/lib/gift-plan-format";
import { formatOperationalStatus } from "@/lib/gift-catalog-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { GiftCatalogReferenceLink } from "@/components/gift-plan/GiftCatalogReferenceLink";
import { GiftCatalogOperationalBadge } from "@/components/gift-plan/GiftCatalogOperationalBadge";
import type { GiftPlanEditorPayload } from "@/types/gift-plan";
import type { GiftCatalogOperationalStatus } from "@/types/gift-catalog";

interface GiftPlanPurchasingSummaryProps {
  payload: GiftPlanEditorPayload;
}

export function GiftPlanPurchasingSummary({
  payload,
}: GiftPlanPurchasingSummaryProps) {
  const tiers = payload.tiers.map((tier) => ({
    name: tier.name,
    customer_count: tier.customer_count,
    items: tier.items,
  }));
  const rows = buildPurchasingSummary(
    tiers,
    payload.purchase_groups.map((group) => ({
      id: group.id,
      buffer_percentage: group.buffer_percentage,
    })),
  );

  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{t.purchasingSummary}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="px-2 py-2 font-medium">{t.purchasingGiftItem}</th>
              <th className="px-2 py-2 font-medium">{t.source}</th>
              <th className="px-2 py-2 font-medium">{t.purchasingReferenceUrl}</th>
              <th className="px-2 py-2 font-medium">{t.purchasingOperationalStatus}</th>
              <th className="px-2 py-2 font-medium">{t.baseRequiredQty}</th>
              <th className="px-2 py-2 font-medium">{t.bufferPercentCol}</th>
              <th className="px-2 py-2 font-medium">{t.finalRequiredQty}</th>
              <th className="px-2 py-2 font-medium">{t.purchasingUnitCost}</th>
              <th className="px-2 py-2 font-medium">{t.finalPurchaseCostCol}</th>
              <th className="px-2 py-2 font-medium">{t.purchasingSupplier}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.group_key} className="border-b border-gray-50">
                <td className="px-2 py-2 font-medium text-gray-900">
                  {row.gift_name}
                </td>
                <td className="px-2 py-2 text-gray-600">{row.source}</td>
                <td className="max-w-[8rem] px-2 py-2">
                  <GiftCatalogReferenceLink
                    url={row.reference_url}
                    variant="text"
                  />
                </td>
                <td className="px-2 py-2">
                  {row.operational_status ? (
                    <GiftCatalogOperationalBadge
                      status={
                        row.operational_status as GiftCatalogOperationalStatus
                      }
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-2">
                  {row.base_required_qty_status === "pending"
                    ? t.pendingCustomerCount
                    : formatGiftQty(row.base_required_qty)}
                </td>
                <td className="px-2 py-2">{formatGiftPercent(row.buffer_percentage)}</td>
                <td className="px-2 py-2">
                  {formatGiftQty(row.final_required_qty)}
                  {row.is_provisional_qty ? (
                    <span className="ml-1 text-amber-700">
                      ({t.provisionalQtyLabel})
                    </span>
                  ) : null}
                </td>
                <td className="px-2 py-2">
                  {row.unit_actual_cost === "mixed"
                    ? t.purchasingMixed
                    : formatGiftMoney(row.unit_actual_cost)}
                </td>
                <td className="px-2 py-2">
                  {formatGiftMoney(row.final_purchase_cost)}
                </td>
                <td className="px-2 py-2 text-gray-600">{row.supplier ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
