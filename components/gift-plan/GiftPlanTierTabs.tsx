"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import type { TierTabMeta } from "@/lib/gift-plan-tier-navigation";

export type TierTabSelection = "overview" | string;

interface GiftPlanTierTabsProps {
  tabs: TierTabMeta[];
  activeId: TierTabSelection;
  dirty?: boolean;
  onSelect: (id: TierTabSelection) => void;
  className?: string;
}

function warningDot(warnings: TierTabMeta["warnings"]) {
  if (warnings.includes("over_budget") || warnings.includes("missing_cost")) {
    return "bg-fti-red/70";
  }
  if (warnings.includes("missing_customers") || warnings.includes("no_gifts")) {
    return "bg-amber-400";
  }
  return "bg-gray-300";
}

export function GiftPlanTierTabs({
  tabs,
  activeId,
  dirty,
  onSelect,
  className,
}: GiftPlanTierTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [activeId]);

  function scrollBy(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label={t.scrollTiersLeft}
        onClick={() => scrollBy(-180)}
        className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1 shadow-sm md:block"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={t.scrollTiersRight}
        onClick={() => scrollBy(180)}
        className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1 shadow-sm md:block"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin"
      >
        <button
          type="button"
          data-active={activeId === "overview"}
          onClick={() => onSelect("overview")}
          className={cn(
            "min-w-[88px] shrink-0 rounded-xl border px-3 py-2 text-left transition-colors",
            activeId === "overview"
              ? "border-primary bg-light-purple text-primary"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
          )}
        >
          <p className="text-sm font-semibold">{t.overviewTab}</p>
          <p className="text-[11px] text-gray-500">{tabs.length} Tier</p>
        </button>

        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-active={activeId === tab.id}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "min-w-[96px] shrink-0 rounded-xl border px-3 py-2 text-left transition-colors",
              activeId === tab.id
                ? "border-primary bg-light-purple text-primary"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={cn("h-1.5 w-1.5 rounded-full", warningDot(tab.warnings))}
              />
              <p className="truncate text-sm font-semibold">{tab.name}</p>
            </div>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {tab.customerCount.toLocaleString()} ลูกค้า ·{" "}
              {tab.itemCount > 0
                ? t.itemsLabel(tab.itemCount)
                : t.noGiftsSelected}
            </p>
          </button>
        ))}

        {dirty ? (
          <span className="self-center px-2 text-[11px] font-medium text-amber-600">
            {t.unsavedStar}
          </span>
        ) : null}
      </div>
    </div>
  );
}
