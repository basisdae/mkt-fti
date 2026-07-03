"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import {
  OpportunityRow,
  PipelineOverview,
} from "@/components/cards/DashboardCards";
import { QuickFilterChip } from "@/components/search/GlobalSearch";
import { Card } from "@/components/ui/Card";
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

  const topProducts = useMemo(
    () =>
      [...filteredProducts]
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, 5),
    [filteredProducts],
  );

  function toggleQuickFilter(id: DashboardQuickFilter) {
    setQuickFilter((current) => (current === id ? null : id));
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">
          Product Command Center
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 lg:text-base">
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

      <section className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardMetrics.map((metric, i) => (
            <StatCard key={metric.label} metric={metric} accent={accents[i]} />
          ))}
        </div>
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PipelineOverview stages={pipelineOverview} />
        </div>

        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>
            <ul className="divide-y divide-gray-50">
              {recentActivity.map((item) => (
                <li key={item.id} className="px-6 py-4">
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
        <Card padding="none">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              {quickFilter ? "Filtered Products" : "Top Opportunity Products"}
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500">
              No products match this filter.
            </p>
          ) : (
            <div className="divide-y divide-gray-50 px-2 py-1">
              {topProducts.map((product, index) => (
                <OpportunityRow
                  key={product.id}
                  product={product}
                  rank={index + 1}
                />
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
