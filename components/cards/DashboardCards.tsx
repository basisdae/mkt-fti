import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { BrandContextStack } from "@/components/product/BrandContextStack";
import { Card } from "@/components/ui/Card";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import {
  formatCurrencyTHB,
  formatPercent,
  getStatusColor,
  timeAgo,
} from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface OpportunityRowProps {
  product: ProductView;
  rank: number;
}

export function OpportunityRow({ product, rank }: OpportunityRowProps) {
  const statusStyle = getStatusColor(product.status);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 hover:bg-light-purple/40 sm:gap-4 sm:px-4"
    >
      <div className="relative shrink-0">
        <ProductImageDisplay
          src={product.imageUrl}
          alt={product.imageAlt || product.name}
          size="md"
          className="p-1.5"
        />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
          {rank}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary">
          {product.name}
        </p>
        <p className="truncate text-xs text-gray-400">{product.supplier}</p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-success">
          {formatPercent(product.gpPercent)} GP
        </p>
        <p className="text-xs text-gray-400">
          {formatCurrencyTHB(product.ftiSellingPrice)}
        </p>
      </div>

      <Badge variant={statusStyle.badge}>
        {PRODUCT_STATUS_LABELS[product.status]}
      </Badge>

      <div className="hidden w-12 text-right lg:block">
        <p className="text-sm font-bold text-primary">{product.opportunityScore}</p>
        <p className="text-[10px] text-gray-400">score</p>
      </div>
    </Link>
  );
}

interface PipelineOverviewProps {
  stages: { stage: string; count: number; label: string }[];
}

export function PipelineOverview({ stages }: PipelineOverviewProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card interactive>
      <h2 className="mb-5 text-base font-semibold text-gray-900">
        Product Pipeline Overview
      </h2>
      <div className="space-y-3">
        {stages.map((item) => (
          <div key={item.stage} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs font-medium text-gray-500">
              {item.label}
            </span>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
            <span className="w-6 text-right text-xs font-semibold text-gray-700">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface DashboardProductCardProps {
  product: ProductView;
}

export function DashboardProductCard({ product }: DashboardProductCardProps) {
  const statusStyle = getStatusColor(product.status);

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card
        padding="sm"
        interactive
        className="overflow-hidden transition-all duration-200 hover:border-primary/20"
      >
        <ProductImageDisplay
          src={product.imageUrl}
          alt={product.imageAlt || product.name}
          fluid
          frameClassName="mb-3 rounded-xl"
          className="p-3 sm:p-4"
        />
        <div className="px-1 pb-1">
          <BrandContextStack
            strategy={product.brandStrategy}
            compact
            className="mb-3 border-0 bg-transparent px-0 py-0"
          />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary">
                {product.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-gray-400">
                {product.supplier}
              </p>
            </div>
            <Badge variant={statusStyle.badge} className="shrink-0">
              {PRODUCT_STATUS_LABELS[product.status]}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-success">
              {formatPercent(product.gpPercent)} GP
            </span>
            <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
