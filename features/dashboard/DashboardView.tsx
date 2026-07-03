"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FilterX } from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import {
  DashboardProductCard,
  PipelineOverview,
} from "@/components/cards/DashboardCards";
import { ProductSpotlightSlider } from "@/features/dashboard/ProductSpotlightSlider";
import { QuickFilterChip } from "@/components/search/GlobalSearch";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PIPELINE_STAGE_LABELS } from "@/lib/constants";
import {
  DASHBOARD_QUICK_FILTERS,
  filterDashboardProducts,
} from "@/lib/product-filters";
import {
  dashboardMetrics,
  getPipelineOverview,
  getProducts,
  getRecentActivity,
} from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";
import type { DashboardQuickFilter } from "@/types/product";

export function DashboardView() {
  const allProducts = useMemo(() => getProducts(), []);
  const pipelineOverview = useMemo(
    () =>
      getPipelineOverview().map((item) => ({
        ...item,
        label: PIPELINE_STAGE_LABELS[item.stage],
      })),
    [],
  );
  const recentActivity = useMemo(() => getRecentActivity(), []);
  const accents = ["purple", "amber", "sky", "green"] as const;

  const [quickFilter, setQuickFilter] = useState<DashboardQuickFilter | null>(
    null,
  );

  const filteredProducts = useMemo(
    () => filterDashboardProducts(allProducts, "", quickFilter),
    [allProducts, quickFilter],
  );

  const spotlightProducts = useMemo(
    () =>
      [...filteredProducts]
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, 8),
    [filteredProducts],
  );

  const topProducts = useMemo(
    () => spotlightProducts.slice(0, 5),
    [spotlightProducts],
  );

  function toggleQuickFilter(id: DashboardQuickFilter) {
    setQuickFilter((current) => (current === id ? null : id));
  }

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <h1 className="page-title">Product Command Center</h1>
        <p className="page-description">
          Track new product ideas, pricing, pipeline and launch readiness.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {DASHBOARD_QUICK_FILTERS.map((chip) => (
            <QuickFilterChip
              key={chip.id}
              label={chip.label}
              active={quickFilter === chip.id}
              onClick={() => toggleQuickFilter(chip.id)}
            />
          ))}
        </div>

        {quickFilter && (
          <p className="mt-3 text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-primary">
              {filteredProducts.length}
            </span>{" "}
            products matching{" "}
            <span className="font-medium text-gray-700">
              {DASHBOARD_QUICK_FILTERS.find((c) => c.id === quickFilter)?.label}
            </span>
          </p>
        )}
      </div>

      <section className="mb-6 sm:mb-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardMetrics.map((metric, i) => (
            <StatCard key={metric.label} metric={metric} accent={accents[i]} />
          ))}
        </div>
      </section>

      {spotlightProducts.length > 0 && (
        <ProductSpotlightSlider products={spotlightProducts} />
      )}

      <div className="mb-6 grid gap-6 sm:mb-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PipelineOverview stages={pipelineOverview} />
        </div>

        <div className="lg:col-span-2">
          <Card padding="none" interactive>
            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>
            <ul className="divide-y divide-gray-50">
              {recentActivity.map((item) => (
                <li key={item.id} className="px-5 py-4 sm:px-6">
                  <p className="text-sm font-medium text-gray-900">
                    {item.action}
                  </p>
                  <p className="mt-0.5 text-sm text-primary">{item.product}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {timeAgo(item.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <section>
        <Card padding="none" interactive>
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 className="text-base font-semibold text-gray-900">
              {quickFilter ? "Filtered Products" : "Top Opportunity Products"}
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <EmptyState
              icon={FilterX}
              title="No products in this view"
              description="Try another quick filter or browse the full product catalog."
              compact
              action={
                quickFilter ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setQuickFilter(null)}
                  >
                    Clear filter
                  </Button>
                ) : (
                  <Button href="/products" variant="secondary" size="sm">
                    Browse products
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {topProducts.map((product) => (
                <DashboardProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
