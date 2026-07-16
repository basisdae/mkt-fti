"use client";

import {
  formatOperationalStatus,
  operationalBadgeClass,
} from "@/lib/gift-catalog-format";
import type { GiftCatalogOperationalStatus } from "@/types/gift-catalog";
import { cn } from "@/lib/utils";

interface GiftCatalogOperationalBadgeProps {
  status: GiftCatalogOperationalStatus | string;
  className?: string;
}

export function GiftCatalogOperationalBadge({
  status,
  className,
}: GiftCatalogOperationalBadgeProps) {
  const label = formatOperationalStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        operationalBadgeClass(status),
        className,
      )}
      title={label}
    >
      {label}
    </span>
  );
}
