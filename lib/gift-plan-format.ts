import type {
  GiftItemCategory,
  GiftItemSource,
  GiftPlanStatus,
} from "@/types/gift-plan";

export const GIFT_PLAN_STATUS_LABELS: Record<GiftPlanStatus, string> = {
  draft: "Draft",
  review: "Review",
  approved: "Approved",
  preparing: "Preparing",
  completed: "Completed",
};

export const GIFT_ITEM_CATEGORY_LABELS: Record<GiftItemCategory, string> = {
  gift_voucher: "Gift Voucher",
  premium_gift: "Premium Gift",
  certificate: "Certificate",
  product: "Product",
  sales_gift: "Sales Gift",
  executive_gift: "Executive Gift",
  other: "Other",
};

export const GIFT_ITEM_SOURCE_LABELS: Record<GiftItemSource, string> = {
  marketing: "Marketing",
  sales: "Sales",
  executive: "Executive",
  fti_stock: "FTI Stock",
  external_purchase: "External Purchase",
  other: "Other",
};

export function formatGiftMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatGiftPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}%`;
}

export function formatGiftQty(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}
