import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { BrandContextStack } from "@/components/product/BrandContextStack";
import { EvaluationScoreBadge } from "@/components/product/EvaluationScoreBadge";
import { isLowProfitMargin } from "@/lib/pricing";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { formatPipelineStep } from "@/lib/pipeline";
import { resolveProductImageAlt } from "@/lib/product-image";
import {
  cn,
  formatCurrencyTHB,
  formatSignedGp,
  getStatusColor,
  timeAgo,
} from "@/lib/utils";
import type { ProductView } from "@/types/product";

/** Shared desktop grid: product | supplier | moq | cost | fti | gp | dealer | updated */
export const PRODUCT_LIST_GRID =
  "md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_repeat(5,minmax(0,1fr))_minmax(0,0.9fr)]";

const COLUMN_DIVIDER =
  "md:border-r md:border-[#F1F2F7] md:px-4 md:py-4 last:md:border-r-0";

interface ProductListRowProps {
  product: ProductView;
}

function MetricCell({
  label,
  value,
  valueClassName,
  className,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        COLUMN_DIVIDER,
        "flex flex-col items-start justify-center md:items-center md:text-center",
        className,
      )}
    >
      <p className="text-[11px] font-medium text-gray-400">{label}</p>
      <p className={cn("mt-0.5 text-sm text-gray-800", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

export function ProductListRow({ product }: ProductListRowProps) {
  const statusStyle = getStatusColor(product.status);
  const lowGp = isLowProfitMargin(product.gpPercent);
  const pipelineStep = formatPipelineStep(product.pipelineStage);

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group grid grid-cols-1 gap-3 rounded-[20px] border border-gray-100 bg-card shadow-sm shadow-gray-200/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-card-hover)] md:gap-0 md:px-0 md:py-0",
        PRODUCT_LIST_GRID,
      )}
    >
      {/* Product — left aligned */}
      <div
        className={cn(
          COLUMN_DIVIDER,
          "min-w-0 px-4 py-4 md:py-5 md:pl-6 md:text-left",
        )}
      >
        <div className="flex gap-3">
          <ProductImageDisplay
            src={product.imageUrl}
            alt={resolveProductImageAlt(product)}
            size="sm"
            className="p-1"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 group-hover:text-primary">
                {product.name}
              </p>
              <EvaluationScoreBadge
                scorecard={product.evaluationScorecard}
                compact
                showStatus
              />
              <Badge
                variant={statusStyle.badge}
                className={cn("shrink-0", statusStyle.bg)}
              >
                {PRODUCT_STATUS_LABELS[product.status]}
              </Badge>
            </div>
            <p className="mt-1.5 text-xs font-medium text-primary/80">
              {pipelineStep}
            </p>
            <div className="mt-2 max-w-xs">
              <BrandContextStack strategy={product.brandStrategy} compact />
            </div>
          </div>
        </div>
      </div>

      {/* Supplier — center aligned */}
      <div
        className={cn(
          COLUMN_DIVIDER,
          "hidden min-w-0 px-4 md:flex md:items-center md:justify-center md:text-center",
        )}
      >
        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
          {product.supplier}
        </p>
      </div>

      {/* Metrics — mobile stack, desktop columns */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4 md:contents md:px-0 md:pb-0">
        <MetricCell
          label="MOQ"
          value={`${product.moq.toLocaleString()} pcs`}
          valueClassName="font-medium text-gray-900"
        />
        <MetricCell
          label="Cost"
          value={formatCurrencyTHB(product.costThb)}
        />
        <MetricCell
          label="FTI Price"
          value={formatCurrencyTHB(product.ftiSellingPrice)}
          valueClassName="font-medium text-gray-900"
        />
        <MetricCell
          label="GP"
          value={formatSignedGp(product.gpPercent)}
          valueClassName={cn(
            "font-semibold",
            lowGp ? "text-fti-red" : "text-green-800",
          )}
        />
        <MetricCell
          label="Dealer Price"
          value={formatCurrencyTHB(product.dealerPrice)}
        />
      </div>

      {/* Updated — far right */}
      <div
        className={cn(
          COLUMN_DIVIDER,
          "flex items-center justify-between gap-2 px-4 pb-4 md:justify-center md:pb-0 md:pr-6 md:text-center",
        )}
      >
        <span className="text-[11px] font-medium text-gray-400 md:hidden">
          Updated
        </span>
        <span className="text-xs font-medium text-gray-500">
          {timeAgo(product.updatedAt)}
        </span>
      </div>

      <div className="border-t border-[#F1F2F7] px-4 pb-4 pt-3 md:hidden">
        <p className="text-xs text-gray-500">
          <span className="font-medium text-gray-600">Supplier:</span>{" "}
          {product.supplier}
        </p>
      </div>
    </Link>
  );
}

export function ProductListHeader() {
  const headers = [
    { label: "Product", align: "left" as const },
    { label: "Supplier", align: "center" as const },
    { label: "MOQ", align: "center" as const },
    { label: "Cost", align: "center" as const },
    { label: "FTI Price", align: "center" as const },
    { label: "GP", align: "center" as const },
    { label: "Dealer Price", align: "center" as const },
    { label: "Updated", align: "center" as const },
  ];

  return (
    <div
      className={cn(
        "mb-3 hidden rounded-[20px] border border-gray-100 bg-gray-50/80 md:px-0 md:py-0",
        PRODUCT_LIST_GRID,
      )}
    >
      {headers.map((header, index) => (
        <div
          key={header.label}
          className={cn(
            COLUMN_DIVIDER,
            "flex items-center py-3",
            header.align === "left"
              ? "justify-start pl-6 text-left"
              : "justify-center text-center",
            index === headers.length - 1 && "pr-6",
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {header.label}
          </span>
        </div>
      ))}
    </div>
  );
}
