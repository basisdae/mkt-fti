"use client";

import type { ReactNode } from "react";
import { Archive, ArchiveRestore, Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GiftCatalogOperationalBadge } from "@/components/gift-plan/GiftCatalogOperationalBadge";
import { GiftCatalogPlaceholderImage } from "@/components/gift-plan/GiftCatalogPlaceholderImage";
import { GiftCatalogReferenceLink } from "@/components/gift-plan/GiftCatalogReferenceLink";
import { resolveGiftCatalogImageUrl } from "@/lib/gift-catalog-display";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { formatGiftMoney } from "@/lib/gift-plan-format";
import type { GiftCatalogRow } from "@/types/gift-catalog";
import { cn } from "@/lib/utils";

export interface GiftCatalogCardActions {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}

interface GiftCatalogCardProps {
  item: GiftCatalogRow;
  activeTierName: string;
  inActiveTier: boolean;
  activeTierQty: number | null;
  otherTierUsage: Array<{ tierName: string; qty: number }>;
  onAdd: () => void;
  onEditQty: () => void;
  onEdit?: () => void;
  catalogActions?: GiftCatalogCardActions;
  showTierActions?: boolean;
}

const catalogIconButtonClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/95 text-gray-600 shadow-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:h-7 md:w-7";

function CatalogIconButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      data-catalog-no-drag
      onClick={onClick}
      className={cn(catalogIconButtonClass, className)}
    >
      {children}
    </button>
  );
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
  catalogActions,
  showTierActions = true,
}: GiftCatalogCardProps) {
  const imageUrl = resolveGiftCatalogImageUrl(item);
  const isCatalogLayout = !showTierActions;
  const actions = catalogActions ?? (onEdit ? { onEdit } : undefined);
  const displayName = item.gift_name?.trim() || "—";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={displayName}
            className="aspect-[4/3] w-full rounded-xl object-contain bg-gray-50"
          />
        ) : (
          <GiftCatalogPlaceholderImage />
        )}
        {actions ? (
          <div
            className="absolute right-1.5 top-1.5 z-10 flex max-w-[calc(100%-0.75rem)] flex-wrap justify-end gap-0.5"
            data-catalog-no-drag
          >
            <GiftCatalogReferenceLink url={item.reference_url} variant="icon" />
            {actions.onEdit ? (
              <CatalogIconButton label={t.edit} onClick={actions.onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </CatalogIconButton>
            ) : null}
            {actions.onDuplicate ? (
              <CatalogIconButton label={t.duplicate} onClick={actions.onDuplicate}>
                <Copy className="h-3.5 w-3.5" />
              </CatalogIconButton>
            ) : null}
            {actions.onArchive ? (
              <CatalogIconButton label={t.archive} onClick={actions.onArchive}>
                <Archive className="h-3.5 w-3.5" />
              </CatalogIconButton>
            ) : null}
            {actions.onRestore ? (
              <CatalogIconButton label={t.restore} onClick={actions.onRestore}>
                <ArchiveRestore className="h-3.5 w-3.5" />
              </CatalogIconButton>
            ) : null}
            {actions.onDelete ? (
              <CatalogIconButton
                label={t.delete}
                onClick={actions.onDelete}
                className="text-fti-red hover:text-fti-red"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </CatalogIconButton>
            ) : null}
          </div>
        ) : (
          <div className="absolute right-2 top-2">
            <GiftCatalogReferenceLink url={item.reference_url} variant="icon" />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <div
          className={cn(
            "flex items-start justify-between gap-2",
            isCatalogLayout && "justify-end",
          )}
        >
          {!isCatalogLayout ? (
            <p className="line-clamp-2 text-sm font-semibold text-gray-900">
              {displayName}
            </p>
          ) : null}
          <GiftCatalogOperationalBadge status={item.operational_status} />
        </div>
        {item.internal_code ? (
          <p className="text-[11px] text-gray-500">{item.internal_code}</p>
        ) : null}
        <p className="mt-2 text-sm text-gray-700">
          {t.defaultActualCost}: {formatGiftMoney(item.default_actual_cost)}
        </p>
        <p className="text-sm text-gray-700">
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
      ) : isCatalogLayout ? (
        <div
          className="mt-3 flex min-h-[3.25rem] items-center rounded-xl bg-light-purple/50 px-3 py-2"
          title={displayName}
        >
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
            {displayName}
          </p>
        </div>
      ) : null}
    </article>
  );
}
