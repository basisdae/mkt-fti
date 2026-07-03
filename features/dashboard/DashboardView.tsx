"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandFilterBar } from "@/features/dashboard/BrandFilterBar";
import { ProductSpotlightSlider } from "@/features/dashboard/ProductSpotlightSlider";
import { RecentActivitiesPanel } from "@/features/dashboard/RecentActivitiesPanel";
import { TopScoredProductsCard } from "@/features/dashboard/TopScoredProductsCard";
import { TodaySummary } from "@/features/dashboard/TodaySummary";
import { usePipelineStore } from "@/hooks/PipelineStore";
import type { DashboardBrandFilter } from "@/lib/brand-strategy";
import { filterProductsByBrand } from "@/lib/brand-strategy";
import {
  computeTodaySummary,
  formatDashboardDate,
  getSpotlightProducts,
} from "@/lib/dashboard-summary";

export function DashboardView() {
  const { products } = usePipelineStore();
  const [brandFilter, setBrandFilter] = useState<DashboardBrandFilter>("all");

  const filteredProducts = useMemo(
    () => filterProductsByBrand(products, brandFilter),
    [products, brandFilter],
  );

  const todaySummary = useMemo(
    () => computeTodaySummary(filteredProducts),
    [filteredProducts],
  );

  const spotlightProducts = useMemo(
    () => getSpotlightProducts(filteredProducts),
    [filteredProducts],
  );

  const dateLabel = formatDashboardDate();

  return (
    <div className="dashboard-premium page-shell">
      <header className="dashboard-hero mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
              FTI Product Command Center
            </p>
            <h1 className="page-title mt-2">Dashboard</h1>
            <p className="page-description mt-2 max-w-2xl">
              Premium overview of pipeline health, brand portfolio, and top
              opportunities across your product line-up.
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

        <div className="mt-5">
          <BrandFilterBar value={brandFilter} onChange={setBrandFilter} />
          {brandFilter !== "all" && (
            <p className="mt-3 text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-primary">
                {filteredProducts.length}
              </span>{" "}
              products for this brand
            </p>
          )}
        </div>
      </header>

      <TodaySummary metrics={todaySummary} dateLabel={dateLabel} />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {spotlightProducts.length > 0 ? (
            <ProductSpotlightSlider products={spotlightProducts} />
          ) : (
            <div className="rounded-[20px] border border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center text-sm text-gray-500">
              No products match this brand filter.
            </div>
          )}
        </div>
        <div>
          <TopScoredProductsCard products={filteredProducts} />
        </div>
      </div>

      <div className="mt-8 sm:mt-10">
        <RecentActivitiesPanel
          productIds={new Set(filteredProducts.map((p) => p.id))}
        />
      </div>
    </div>
  );
}
