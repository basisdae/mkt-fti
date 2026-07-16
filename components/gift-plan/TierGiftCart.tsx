"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { GiftCatalogPlaceholderImage } from "@/components/gift-plan/GiftCatalogPlaceholderImage";
import { listGiftCatalogAction } from "@/lib/actions/gift-catalog";
import { resolveGiftCatalogImageUrl } from "@/lib/gift-catalog-display";
import { calcGiftItem } from "@/lib/gift-plan-calculations";
import { formatGiftMoney } from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import type { GiftCatalogRow } from "@/types/gift-catalog";
import type { GiftPlanItemInput, GiftPlanTierInput } from "@/types/gift-plan";

interface TierGiftCartProps {
  tier: GiftPlanTierInput;
  onUpdateItem: (itemId: string, patch: Partial<GiftPlanItemInput>) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: -1 | 1) => void;
  onOpenCatalog: () => void;
}

export function TierGiftCart({
  tier,
  onUpdateItem,
  onRemoveItem,
  onMoveItem,
  onOpenCatalog,
}: TierGiftCartProps) {
  const items = [...tier.items].sort((a, b) => a.sort_order - b.sort_order);
  const [catalogById, setCatalogById] = useState<
    Map<string, Pick<GiftCatalogRow, "image_url" | "image_path">>
  >(new Map());

  const missingCatalogIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of items) {
      if (!item.gift_catalog_id) continue;
      if (item.image_path || item.image_url) continue;
      if (!catalogById.has(item.gift_catalog_id)) {
        ids.add(item.gift_catalog_id);
      }
    }
    return [...ids];
  }, [items, catalogById]);

  useEffect(() => {
    if (missingCatalogIds.length === 0) return;
    let cancelled = false;
    void (async () => {
      const result = await listGiftCatalogAction({ includeArchived: true });
      if (cancelled || !result.ok) return;
      setCatalogById((current) => {
        const next = new Map(current);
        for (const row of result.data) {
          if (missingCatalogIds.includes(row.id)) {
            next.set(row.id, {
              image_url: row.image_url,
              image_path: row.image_path,
            });
          }
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [missingCatalogIds]);

  function imageForItem(item: GiftPlanItemInput): string | null {
    if (item.image_path || item.image_url) {
      return resolveGiftCatalogImageUrl({
        image_url: item.image_url ?? null,
        image_path: item.image_path ?? null,
      });
    }
    if (item.gift_catalog_id) {
      const catalog = catalogById.get(item.gift_catalog_id);
      if (catalog) return resolveGiftCatalogImageUrl(catalog);
    }
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">{t.selectedGifts}</h4>
        <Button variant="secondary" size="sm" onClick={onOpenCatalog}>
          {t.addGiftToTier}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          {t.emptyCartHint}
        </div>
      ) : (
        items.map((item, index) => {
          const calc = calcGiftItem(
            {
              id: item.id,
              tier_id: item.tier_id,
              category: item.category,
              qty_per_customer: Number(item.qty_per_customer),
              unit_actual_cost: Number(item.unit_actual_cost),
              estimated_gift_value_per_unit: Number(
                item.estimated_gift_value_per_unit,
              ),
              purchase_group_id: item.purchase_group_id,
            },
            tier.customer_count,
          );
          const imageUrl = imageForItem(item);

          return (
            <article
              key={item.id}
              className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
            >
              <div className="flex gap-3">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={item.gift_name}
                    className="h-16 w-16 shrink-0 rounded-lg object-contain bg-gray-50"
                  />
                ) : (
                  <GiftCatalogPlaceholderImage className="h-16 w-16 shrink-0 rounded-lg" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">
                    {item.gift_name || t.untitledGift}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {t.qtyPerCustomer} {item.qty_per_customer} · {t.required}{" "}
                    {calc.total_quantity.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {t.actualPerCust} {formatGiftMoney(calc.actual_cost_per_customer)} /{" "}
                    {t.perCust} · {t.estPerCust}{" "}
                    {formatGiftMoney(calc.estimated_value_per_customer)} / {t.perCust}
                  </p>
                  <p className="text-[11px] font-medium text-gray-700">
                    {t.tierTotalActual} {formatGiftMoney(calc.total_actual_cost)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => onMoveItem(item.id, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === items.length - 1}
                    onClick={() => onMoveItem(item.id, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Input
                  label={t.qtyPerCustomer}
                  type="number"
                  value={String(item.qty_per_customer)}
                  onChange={(e) =>
                    onUpdateItem(item.id, {
                      qty_per_customer: Number(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  label={t.unitActualCost}
                  type="number"
                  value={String(item.unit_actual_cost)}
                  onChange={(e) =>
                    onUpdateItem(item.id, {
                      unit_actual_cost: Number(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  label={t.estValuePerUnit}
                  type="number"
                  value={String(item.estimated_gift_value_per_unit)}
                  onChange={(e) =>
                    onUpdateItem(item.id, {
                      estimated_gift_value_per_unit: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const qty = window.prompt(
                      t.quantityPerCustomer,
                      String(item.qty_per_customer),
                    );
                    if (qty != null) {
                      onUpdateItem(item.id, {
                        qty_per_customer: Number(qty) || 0,
                      });
                    }
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  {t.edit}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(t.removeFromTierConfirm(item.gift_name))
                    ) {
                      onRemoveItem(item.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-fti-red" />
                  {t.remove}
                </Button>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
