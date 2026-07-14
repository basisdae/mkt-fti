"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, Clock3, Pencil, StickyNote } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EvaluationScoreBadge } from "@/components/product/EvaluationScoreBadge";
import { OutputFunctionBadges } from "@/components/product/OutputFunctionBadges";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { ProductResumeExportButton } from "@/components/product/ProductResumeExport";
import { useAuth } from "@/hooks/AuthStore";
import {
  canEditProducts,
  canEditProductSpecs,
} from "@/lib/auth/permissions";
import {
  formatCapacityLDisplay,
  formatGpdDisplay,
  formatRatedFlowLhDisplay,
  getProductPerformanceFromSpecification,
  hasProductPerformance,
} from "@/lib/product-performance";
import {
  getSpecActionLabel,
  getSpecStatusBadgeClasses,
  PRODUCT_SPEC_STATUS_LABELS,
  resolveProductSpecStatus,
} from "@/lib/product-specification";
import { cn, timeAgo } from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface ProductDetailHeaderProps {
  product: ProductView;
  imagePreviewUrl?: string | null;
  imageAlt?: string;
}

function PerformanceIdentityFields({
  product,
}: {
  product: ProductView;
}) {
  const performance = getProductPerformanceFromSpecification(
    product.specification,
  );
  if (!hasProductPerformance(performance)) return null;

  const rows = [
    {
      label: "Rated Flow",
      value: formatRatedFlowLhDisplay(performance.ratedFlowLh),
    },
    { label: "GPD", value: formatGpdDisplay(performance.gpd) },
    { label: "Capacity", value: formatCapacityLDisplay(performance.capacityL) },
  ].filter((row) => row.value !== "—");

  if (rows.length === 0) return null;

  return (
    <dl className="grid gap-2 sm:grid-cols-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2"
        >
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {row.label}
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-gray-900">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProductDetailHeader({
  product,
  imagePreviewUrl,
  imageAlt,
}: ProductDetailHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canEditProducts(user);
  const canEditSpec = canEditProductSpecs(user);
  const specStatus = resolveProductSpecStatus(product);
  const model = product.productSystem?.trim();

  return (
    <div className="mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <ProductImageDisplay
            src={imagePreviewUrl ?? product.imageUrl}
            alt={imageAlt || product.imageAlt || product.name}
            size="lg"
            className="p-2"
          />

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={product.status} />
              <EvaluationScoreBadge
                scorecard={product.evaluationScorecard}
                showStatus
              />
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                  getSpecStatusBadgeClasses(specStatus),
                )}
              >
                Spec: {PRODUCT_SPEC_STATUS_LABELS[specStatus]}
              </span>
            </div>

            <section aria-label="Product identity" className="space-y-3">
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Output Function
                </p>
                <OutputFunctionBadges tagLinks={product.tagLinks} />
              </div>

              <p className="font-mono text-xs font-semibold tracking-wide text-gray-500">
                {product.code?.trim() || "—"}
              </p>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">
                  {product.name}
                </h1>
                {model ? (
                  <p className="mt-1 text-sm font-medium text-gray-600">
                    Model {model}
                  </p>
                ) : null}
              </div>

              <PerformanceIdentityFields product={product} />
            </section>

            {product.description?.trim() ? (
              <p className="mt-3 max-w-2xl text-sm text-gray-400">
                {product.description}
              </p>
            ) : null}

            <p className="mt-3 text-xs text-gray-400">
              Updated {timeAgo(product.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {canEditSpec && (
            <Link
              href={`/products/${product.id}/spec`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9F1239] px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#9F1239]/90"
            >
              <ClipboardList className="h-4 w-4" />
              {getSpecActionLabel(specStatus)}
            </Link>
          )}
          <ProductResumeExportButton product={product} />
          {canEdit && (
            <Button href={`/notes?product=${product.id}`} variant="secondary" size="sm">
              <StickyNote className="h-4 w-4" />
              Notes
            </Button>
          )}
          <Button href={`/timeline?product=${product.id}`} variant="secondary" size="sm">
            <Clock3 className="h-4 w-4" />
            Timeline
          </Button>
          {canEdit && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/products/${product.id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
              Edit Product
            </Button>
          )}
          <Button href="/products" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {product.latestNote && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
          <p className="text-xs font-medium text-gray-400">Latest note</p>
          <p className="mt-1 text-sm text-gray-700">{product.latestNote}</p>
          {canEdit && (
            <Link
              href={`/notes?product=${product.id}`}
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              View all notes →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
