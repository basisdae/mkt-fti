"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GiftCatalogOperationalBadge } from "@/components/gift-plan/GiftCatalogOperationalBadge";
import { GiftCatalogPlaceholderImage } from "@/components/gift-plan/GiftCatalogPlaceholderImage";
import { GiftCatalogReferenceLink } from "@/components/gift-plan/GiftCatalogReferenceLink";
import { resolveGiftCatalogImageUrl } from "@/lib/gift-catalog-display";
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
  onEdit?: () => void;
  showTierActions?: boolean;
}

export function GiftCatalogCard({
  item,
  activeTierName,
  inActiveTier,
  activeTierQty,
  otherTierUsage,
  onAdd,
  onEditQty,
  onEdit,
  showTierActions = true,
}: GiftCatalogCardProps) {
  const imageUrl = resolveGiftCatalogImageUrl(item);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="relative">
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
        <div className="absolute right-2 top-2 flex gap-1">
          <GiftCatalogReferenceLink url={item.reference_url} variant="icon" />
          {onEdit ? (
            <button
              type="button"
              title={t.edit}
              data-catalog-no-drag
              onClick={onEdit}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-gray-600 shadow-sm hover:bg-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold text-gray-900">
            {item.gift_name}
          </p>
          <GiftCatalogOperationalBadge status={item.operational_status} />
        </div>
        {item.internal_code ? (
          <p className="text-[11px] text-gray-400">{item.internal_code}</p>
        ) : null}
        <p className="mt-2 text-[11px] text-gray-600">
          {t.defaultActualCost}: {formatGiftMoney(item.default_actual_cost)}
        </p>
        <p className="text-[11px] text-gray-600">
          {t.defaultEstValue}: {formatGiftMoney(item.default_estimated_gift_value)}
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

      {showTierActions ? (
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
      ) : onEdit ? (
        <Button
          className="mt-3 w-full"
          variant="secondary"
          size="sm"
          data-catalog-no-drag
          onClick={onEdit}
        >
          {t.edit}
        </Button>
      ) : null}
    </article>
  );
}
