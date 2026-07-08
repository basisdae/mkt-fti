"use client";

import { cn } from "@/lib/utils";
import type { ProductTagLink } from "@/lib/product-tags";

interface ProductTagBadgesProps {
  links?: ProductTagLink[] | null;
  className?: string;
  compact?: boolean;
  /** Show group name above badges (detail view). */
  showGroups?: boolean;
}

export function ProductTagBadges({
  links,
  className,
  compact = false,
  showGroups = false,
}: ProductTagBadgesProps) {
  const items = (links ?? []).filter(
    (link) => (link.customLabel || link.label || "").trim(),
  );
  if (items.length === 0) return null;

  const byGroup = new Map<string, { name: string; labels: string[] }>();
  for (const link of items) {
    const key = link.groupKey || link.groupName || "tags";
    const name = link.groupName || link.groupKey || "Tags";
    const label = (link.customLabel || link.label || "").trim();
    if (!label) continue;
    const entry = byGroup.get(key) ?? { name, labels: [] };
    if (!entry.labels.includes(label)) entry.labels.push(label);
    byGroup.set(key, entry);
  }

  if (showGroups) {
    return (
      <div className={cn("space-y-2", className)}>
        {[...byGroup.entries()].map(([key, group]) => (
          <div key={key}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {group.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {[...byGroup.values()].flatMap((group) =>
        group.labels.map((label) => (
          <span
            key={`${group.name}-${label}`}
            className={cn(
              "rounded-full border border-gray-200 bg-gray-50 font-semibold text-gray-600",
              compact
                ? "px-2 py-0.5 text-[10px]"
                : "px-2.5 py-1 text-[11px]",
            )}
          >
            {label}
          </span>
        )),
      )}
    </div>
  );
}
