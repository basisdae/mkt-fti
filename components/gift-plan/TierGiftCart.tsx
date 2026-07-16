"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import {
  calcGiftItem,
} from "@/lib/gift-plan-calculations";
import { formatGiftMoney } from "@/lib/gift-plan-format";
import { GiftCatalogPlaceholderImage } from "@/components/gift-plan/GiftCatalogPlaceholderImage";
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">ของขวัญที่เลือก</h4>
        <Button variant="secondary" size="sm" onClick={onOpenCatalog}>
          เพิ่มของขวัญ
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          ยังไม่มีของใน Tier นี้ — เปิดคลังเพื่อเลือกของ
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

          return (
            <article
              key={item.id}
              className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
            >
              <div className="flex gap-3">
                <GiftCatalogPlaceholderImage className="h-16 w-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">
                    {item.gift_name || "Untitled gift"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Qty/Customer {item.qty_per_customer} · Required{" "}
                    {calc.total_quantity.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Actual {formatGiftMoney(calc.actual_cost_per_customer)} / cust ·
                    Est. {formatGiftMoney(calc.estimated_value_per_customer)} / cust
                  </p>
                  <p className="text-[11px] font-medium text-gray-700">
                    Tier total actual {formatGiftMoney(calc.total_actual_cost)}
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
                  label="Qty / Customer"
                  type="number"
                  value={String(item.qty_per_customer)}
                  onChange={(e) =>
                    onUpdateItem(item.id, {
                      qty_per_customer: Number(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  label="Unit Actual Cost"
                  type="number"
                  value={String(item.unit_actual_cost)}
                  onChange={(e) =>
                    onUpdateItem(item.id, {
                      unit_actual_cost: Number(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  label="Est. Value / Unit"
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
                      "Quantity per customer",
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
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove "${item.gift_name}" from this tier only?`,
                      )
                    ) {
                      onRemoveItem(item.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-fti-red" />
                  Remove
                </Button>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
