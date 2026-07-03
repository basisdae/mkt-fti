"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductSpotlightSlider } from "@/features/dashboard/ProductSpotlightSlider";
import { RecentActivitiesPanel } from "@/features/dashboard/RecentActivitiesPanel";
import { TodaySummary } from "@/features/dashboard/TodaySummary";
import { usePipelineStore } from "@/hooks/PipelineStore";
import {
  computeTodaySummary,
  formatDashboardDate,
  getSpotlightProducts,
} from "@/lib/dashboard-summary";

export function DashboardView() {
  const { products } = usePipelineStore();

  const todaySummary = useMemo(
    () => computeTodaySummary(products),
    [products],
  );

  const spotlightProducts = useMemo(
    () => getSpotlightProducts(products),
    [products],
  );

  const dateLabel = formatDashboardDate();

  return (
    <div className="dashboard-premium page-shell">
      <header className="dashboard-hero mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
              FTI Product Command Center
            </p>
            <h1 className="page-title mt-2">Dashboard</h1>
            <p className="page-description mt-2 max-w-2xl">
              Premium overview of pipeline health, top opportunities, and the
              latest sourcing activity across your product line-up.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-sm font-medium text-primary shadow-sm transition-all hover:border-primary/25 hover:bg-light-purple/40 sm:self-auto"
          >
            View catalog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <TodaySummary metrics={todaySummary} dateLabel={dateLabel} />

      {spotlightProducts.length > 0 && (
        <div className="mt-8 sm:mt-10">
          <ProductSpotlightSlider products={spotlightProducts} />
        </div>
      )}

      <div className="mt-8 sm:mt-10">
        <RecentActivitiesPanel />
      </div>
    </div>
  );
}
