import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
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
      className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-light-purple/40"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-light-purple text-sm font-bold text-primary">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          {product.name}
        </p>
        <p className="text-xs text-gray-400">{product.supplier}</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-success">
          {formatPercent(product.gpPercent)} GP
        </p>
        <p className="text-xs text-gray-400">
          {formatCurrencyTHB(product.ftiSellingPrice)}
        </p>
      </div>
      <Badge variant={statusStyle.badge}>{PRODUCT_STATUS_LABELS[product.status]}</Badge>
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
    <Card>
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
