import {
  GIFT_ITEM_CATEGORY_LABELS,
  GIFT_ITEM_SOURCE_LABELS,
} from "@/lib/gift-plan-format";
import type { GiftCatalogStatus } from "@/types/gift-catalog";

export const GIFT_CATALOG_STATUS_LABELS: Record<GiftCatalogStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

export function formatGiftCatalogCategory(
  category: keyof typeof GIFT_ITEM_CATEGORY_LABELS,
): string {
  return GIFT_ITEM_CATEGORY_LABELS[category];
}

export function formatGiftCatalogSource(
  source: keyof typeof GIFT_ITEM_SOURCE_LABELS,
): string {
  return GIFT_ITEM_SOURCE_LABELS[source];
}

export function truncateSupplierName(value: string | null, max = 24): string {
  const text = (value ?? "").trim();
  if (!text) return "—";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
