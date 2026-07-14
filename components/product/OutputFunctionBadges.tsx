"use client";

import { cn } from "@/lib/utils";
import {
  getOutputFunctionBadges,
  type OutputFunctionBadge,
} from "@/lib/output-function";
import type { ProductTagLink } from "@/lib/product-tags";

interface OutputFunctionBadgesProps {
  tagLinks?: ProductTagLink[] | null;
  className?: string;
}

export function OutputFunctionBadges({
  tagLinks,
  className,
}: OutputFunctionBadgesProps) {
  const badges = getOutputFunctionBadges(tagLinks);
  if (badges.length === 0) {
    return <div className={cn("min-h-0", className)} aria-hidden />;
  }

  return (
    <div className={cn("flex min-h-[1.75rem] flex-wrap gap-1.5", className)}>
      {badges.map((badge: OutputFunctionBadge) => (
        <span
          key={`${badge.value}-${badge.label}`}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            badge.badgeClass,
          )}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
