"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Copy,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProductCardTitle } from "@/components/product/ProductCardTitle";
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

/** Shared desktop grid: product | supplier | moq | cost | fti | gp | dealer | updated | actions */
export const PRODUCT_LIST_GRID =
  "md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_repeat(5,minmax(0,0.9fr))_minmax(0,0.8fr)_minmax(0,1.35fr)]";

const COLUMN_DIVIDER =
  "md:border-r md:border-[#F1F2F7] md:px-4 md:py-4 last:md:border-r-0";

interface ProductListRowProps {
  product: ProductView;
  readOnly?: boolean;
  canDelete?: boolean;
  onDuplicate: (product: ProductView) => void;
  onArchive: (product: ProductView) => void;
  onDelete: (product: ProductView) => void;
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

function ActionButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
        danger
          ? "text-fti-red hover:bg-red-50"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      {children}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

export function ProductListRow({
  product,
  readOnly = false,
  canDelete = true,
  onDuplicate,
  onArchive,
  onDelete,
}: ProductListRowProps) {
  const router = useRouter();
  const statusStyle = getStatusColor(product.status);
  const lowGp = isLowProfitMargin(product.gpPercent);
  const pipelineStep = formatPipelineStep(product.pipelineStage);

  return (
    <div
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
        <Link href={`/products/${product.id}`} className="flex gap-3">
          <ProductImageDisplay
            src={product.imageUrl}
            alt={resolveProductImageAlt(product)}
            size="sm"
            className="p-1"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <ProductCardTitle
                as="p"
                className="min-w-0 flex-1 group-hover:text-primary"
              >
                {product.name}
              </ProductCardTitle>
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
            <div className="mt-2 max-w-xs md:max-w-md lg:max-w-lg">
              <BrandContextStack strategy={product.brandStrategy} compact />
            </div>
          </div>
        </Link>
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

      {/* Updated */}
      <div
        className={cn(
          COLUMN_DIVIDER,
          "flex items-center justify-between gap-2 px-4 pb-4 md:justify-center md:pb-0 md:text-center",
        )}
      >
        <span className="text-[11px] font-medium text-gray-400 md:hidden">
          Updated
        </span>
        <span className="text-xs font-medium text-gray-500">
          {timeAgo(product.updatedAt)}
        </span>
      </div>

      {/* Actions — far right */}
      <div
        className={cn(
          COLUMN_DIVIDER,
          "flex flex-wrap items-center gap-0.5 px-4 pb-4 md:justify-end md:pb-0 md:pr-4",
        )}
      >
        <ActionButton
          label="View"
          onClick={() => router.push(`/products/${product.id}`)}
        >
          <Eye className="h-3.5 w-3.5" />
        </ActionButton>
        {!readOnly && (
          <>
            <ActionButton
              label="Edit"
              onClick={() => router.push(`/products/${product.id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton label="Duplicate" onClick={() => onDuplicate(product)}>
              <Copy className="h-3.5 w-3.5" />
            </ActionButton>
            <ActionButton label="Archive" onClick={() => onArchive(product)}>
              <Archive className="h-3.5 w-3.5" />
            </ActionButton>
          </>
        )}
        {canDelete && (
          <ActionButton label="Delete" danger onClick={() => onDelete(product)}>
            <Trash2 className="h-3.5 w-3.5" />
          </ActionButton>
        )}
      </div>

      <div className="border-t border-[#F1F2F7] px-4 pb-4 pt-3 md:hidden">
        <p className="text-xs text-gray-500">
          <span className="font-medium text-gray-600">Supplier:</span>{" "}
          {product.supplier}
        </p>
      </div>
    </div>
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
    { label: "Actions", align: "right" as const },
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
            header.align === "left" && "justify-start pl-6 text-left",
            header.align === "center" && "justify-center text-center",
            header.align === "right" && "justify-end pr-4 text-right",
            index === headers.length - 1 && "pr-4",
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
