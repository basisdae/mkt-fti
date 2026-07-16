"use client";

import type { GiftCatalogOperationalStatus } from "@/types/gift-catalog";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { cn } from "@/lib/utils";

export type OperationalSummaryKey =
  | "interested"
  | "in_progress"
  | "ordered"
  | "blocked"
  | "received";

const SUMMARY_KEYS: OperationalSummaryKey[] = [
  "interested",
  "in_progress",
  "ordered",
  "blocked",
  "received",
];

interface GiftCatalogSummaryStripProps {
  counts: Record<GiftCatalogOperationalStatus, number>;
  activeFilter: string;
  onFilter: (filter: OperationalSummaryKey | "all") => void;
}

export function GiftCatalogSummaryStrip({
  counts,
  activeFilter,
  onFilter,
}: GiftCatalogSummaryStripProps) {
  const cards: Array<{
    key: OperationalSummaryKey | "all";
    label: string;
    count: number;
  }> = [
    {
      key: "interested",
      label: t.summaryInterested,
      count: counts.interested,
    },
    {
      key: "in_progress",
      label: t.summaryInProgress,
      count: counts.in_progress,
    },
    { key: "ordered", label: t.summaryOrdered, count: counts.ordered },
    { key: "blocked", label: t.summaryBlocked, count: counts.blocked },
    { key: "received", label: t.summaryReceived, count: counts.received },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onFilter(card.key)}
          className={cn(
            "rounded-xl border px-3 py-2 text-left transition-colors",
            activeFilter === card.key
              ? "border-primary bg-light-purple/40"
              : "border-gray-100 bg-white hover:border-primary/30",
          )}
        >
          <p className="text-[10px] text-gray-500">{card.label}</p>
          <p className="text-lg font-semibold text-gray-900">{card.count}</p>
        </button>
      ))}
    </div>
  );
}

export function emptyOperationalCounts(): Record<
  GiftCatalogOperationalStatus,
  number
> {
  return {
    interested: 0,
    in_progress: 0,
    ordered: 0,
    blocked: 0,
    completed: 0,
    received: 0,
  };
}

export { SUMMARY_KEYS };
