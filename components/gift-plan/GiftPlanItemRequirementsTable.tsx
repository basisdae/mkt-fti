"use client";

import {
  buildPurchasingInputFromEditor,
  buildPurchasingSummary,
  calcCampaignPurchasingTotals,
} from "@/lib/gift-plan-calculations";
import { formatGiftMoney, formatGiftPercent, formatGiftQty } from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { GiftCatalogReferenceLink } from "@/components/gift-plan/GiftCatalogReferenceLink";
import { GiftCatalogOperationalBadge } from "@/components/gift-plan/GiftCatalogOperationalBadge";
import { Input } from "@/components/forms/Input";
import type { GiftPlanEditorPayload } from "@/types/gift-plan";
import type { GiftCatalogOperationalStatus } from "@/types/gift-catalog";
import { cn } from "@/lib/utils";

interface GiftPlanItemRequirementsTableProps {
  payload: GiftPlanEditorPayload;
  onUpdateBuffer: (groupId: string, bufferPercent: number) => void;
}

export function GiftPlanItemRequirementsTable({
  payload,
  onUpdateBuffer,
}: GiftPlanItemRequirementsTableProps) {
  const input = buildPurchasingInputFromEditor(payload);
  const rows = buildPurchasingSummary(input.tiers, input.purchaseGroups);
  const totals = calcCampaignPurchasingTotals(rows);

  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {t.itemRequirementsTitle}
          </h3>
          <p className="mt-1 text-xs text-gray-500">{t.itemRequirementsSubtitle}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-gray-400">{t.baseGiftUnits}</dt>
            <dd className="font-medium">{formatGiftQty(totals.base_gift_units)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">{t.bufferGiftUnits}</dt>
            <dd className="font-medium">{formatGiftQty(totals.buffer_gift_units)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">{t.finalGiftUnits}</dt>
            <dd className="font-medium">
              {formatGiftQty(totals.final_gift_units)}
              {totals.has_provisional_qty ? (
                <span className="ml-1 text-amber-700">({t.provisionalQtyLabel})</span>
              ) : null}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="px-2 py-2 font-medium">{t.purchasingGiftItem}</th>
              <th className="px-2 py-2 font-medium">{t.specification}</th>
              <th className="px-2 py-2 font-medium">{t.purchasingSupplier}</th>
              <th className="px-2 py-2 font-medium">{t.source}</th>
              <th className="px-2 py-2 font-medium">{t.usedInTiers}</th>
              <th className="px-2 py-2 font-medium">{t.baseRequiredQty}</th>
              <th className="px-2 py-2 font-medium">{t.bufferPercentCol}</th>
              <th className="px-2 py-2 font-medium">{t.bufferQtyCol}</th>
              <th className="px-2 py-2 font-medium">{t.finalRequiredQty}</th>
              <th className="px-2 py-2 font-medium">{t.purchasingUnitCost}</th>
              <th className="px-2 py-2 font-medium">{t.baseActualCostCol}</th>
              <th className="px-2 py-2 font-medium">{t.bufferCostCol}</th>
              <th className="px-2 py-2 font-medium">{t.finalPurchaseCostCol}</th>
              <th className="px-2 py-2 font-medium">{t.purchasingOperationalStatus}</th>
              <th className="px-2 py-2 font-medium">{t.purchasingReferenceUrl}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.group_key} className="border-b border-gray-50 align-top">
                <td className="px-2 py-2 font-medium text-gray-900">
                  {row.gift_name}
                </td>
                <td className="max-w-[8rem] px-2 py-2 text-gray-600">
                  {row.specification || "—"}
                </td>
                <td className="px-2 py-2 text-gray-600">{row.supplier ?? "—"}</td>
                <td className="px-2 py-2 text-gray-600">{row.source}</td>
                <td className="px-2 py-2 text-gray-600">
                  {row.tier_names.join(", ")}
                </td>
                <td className="px-2 py-2">
                  <span
                    className={cn(
                      row.is_provisional_qty && "text-amber-800",
                    )}
                  >
                    {row.base_required_qty_status === "pending"
                      ? t.pendingCustomerCount
                      : formatGiftQty(row.base_required_qty)}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="flex min-w-[7rem] items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={String(row.buffer_percentage)}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const next = Number.isFinite(raw)
                          ? Math.min(100, Math.max(0, raw))
                          : 0;
                        onUpdateBuffer(row.purchase_group_id, next);
                      }}
                      className="py-1 text-xs"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                  {row.buffer_qty > 0 ? (
                    <p className="mt-0.5 text-[10px] text-gray-500">
                      +{formatGiftQty(row.buffer_qty)} {t.piecesSuffix}
                    </p>
                  ) : null}
                </td>
                <td className="px-2 py-2">{formatGiftQty(row.buffer_qty)}</td>
                <td className="px-2 py-2 font-medium">
                  {formatGiftQty(row.final_required_qty)}
                  {row.is_provisional_qty ? (
                    <span className="ml-1 text-[10px] text-amber-700">
                      {t.provisionalQtyLabel}
                    </span>
                  ) : null}
                </td>
                <td className="px-2 py-2">
                  {row.unit_actual_cost === "mixed"
                    ? t.purchasingMixed
                    : formatGiftMoney(row.unit_actual_cost)}
                </td>
                <td className="px-2 py-2">{formatGiftMoney(row.base_actual_cost)}</td>
                <td className="px-2 py-2">{formatGiftMoney(row.buffer_actual_cost)}</td>
                <td className="px-2 py-2 font-medium">
                  {formatGiftMoney(row.final_purchase_cost)}
                </td>
                <td className="px-2 py-2">
                  {row.operational_status ? (
                    <GiftCatalogOperationalBadge
                      status={row.operational_status as GiftCatalogOperationalStatus}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-[8rem] px-2 py-2">
                  <GiftCatalogReferenceLink url={row.reference_url} variant="text" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
