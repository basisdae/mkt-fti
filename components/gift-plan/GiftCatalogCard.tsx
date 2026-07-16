"use client";

import { Button } from "@/components/ui/Button";
import { GiftCatalogPlaceholderImage } from "@/components/gift-plan/GiftCatalogPlaceholderImage";
import { resolveGiftCatalogImageUrl } from "@/lib/gift-catalog-display";
import {
  formatGiftCatalogCategory,
  formatGiftCatalogSource,
  giftCatalogUnitLabel,
  GIFT_CATALOG_STATUS_LABELS,
  truncateSupplierName,
} from "@/lib/gift-catalog-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { formatGiftMoney } from "@/lib/gift-plan-format";
import type { GiftCatalogRow } from "@/types/gift-catalog";

interface GiftCatalogCardProps {
  item: GiftCatalogRow;
  activeTierName: string;
  inActiveTier: boolean;
  activeTierQty: number | null;
  otherTierUsage: Array<{ tierName: string; qty: number }>;
  onAdd: () => void;
  onEditQty: () => void;
}

export function GiftCatalogCard({
  item,
  activeTierName,
  inActiveTier,
  activeTierQty,
  otherTierUsage,
  onAdd,
  onEditQty,
}: GiftCatalogCardProps) {
  const imageUrl = resolveGiftCatalogImageUrl(item);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={item.gift_name}
          className="aspect-[4/3] w-full rounded-xl object-contain bg-gray-50"
        />
      ) : (
        <GiftCatalogPlaceholderImage />
      )}

      <div className="mt-3 flex-1">
        <p className="line-clamp-2 text-sm font-semibold text-gray-900">
          {item.gift_name}
        </p>
        {item.internal_code ? (
          <p className="text-[11px] text-gray-400">{item.internal_code}</p>
        ) : null}
        <p className="mt-1 text-[11px] text-gray-500">
          {formatGiftCatalogCategory(item.category)} ·{" "}
          {formatGiftCatalogSource(item.source)}
        </p>
        <p className="text-[11px] text-gray-500">
          {giftCatalogUnitLabel(item.unit)} ·{" "}
          {formatGiftMoney(item.default_actual_cost)} · {t.estLabel}{" "}
          {formatGiftMoney(item.default_estimated_gift_value)}
        </p>
        <p className="text-[11px] text-gray-500">
          {truncateSupplierName(item.supplier_name)}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
          {GIFT_CATALOG_STATUS_LABELS[item.status]}
        </p>

        {inActiveTier ? (
          <div className="mt-2 rounded-lg bg-light-purple/50 px-2 py-1 text-[11px] text-primary">
            {t.addedToTier(activeTierName)}
            {activeTierQty != null
              ? ` · ${activeTierQty} ${t.perCustomer}`
              : ""}
          </div>
        ) : null}

        {otherTierUsage.length > 0 ? (
          <p className="mt-1 text-[10px] text-gray-400">
            {t.usedInOtherTiers}{" "}
            {otherTierUsage.map((u) => `${u.tierName} × ${u.qty}`).join(" · ")}
          </p>
        ) : null}
      </div>

      <Button
        className="mt-3 w-full"
        variant={inActiveTier ? "secondary" : "primary"}
        size="sm"
        onClick={inActiveTier ? onEditQty : onAdd}
      >
        {inActiveTier
          ? t.editQtyInTier(activeTierName)
          : t.addToTier(activeTierName)}
      </Button>
    </article>
  );
}
