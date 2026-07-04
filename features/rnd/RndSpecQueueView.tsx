"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, FlaskConical } from "lucide-react";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/AuthStore";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { formatProductBrand } from "@/lib/brand-strategy";
import {
  countProductsBySpecStatus,
  getSpecActionLabel,
  getSpecStatusBadgeClasses,
  needsSpecWork,
  PRODUCT_SPEC_STATUS_LABELS,
  resolveProductSpecStatus,
  sortProductsBySpecQueue,
} from "@/lib/product-specification";
import { resolveProductImageAlt } from "@/lib/product-image";
import { cn, timeAgo } from "@/lib/utils";
import type { ProductSpecStatus, ProductView } from "@/types/product";

type QueueFilter = "pending" | ProductSpecStatus;

const FILTERS: { id: QueueFilter; label: string }[] = [
  { id: "pending", label: "Needs work" },
  { id: "not_started", label: "Not Started" },
  { id: "draft", label: "Draft" },
  { id: "need_review", label: "Need Review" },
  { id: "completed", label: "Completed" },
];

function filterProducts(
  products: ProductView[],
  filter: QueueFilter,
): ProductView[] {
  if (filter === "pending") {
    return sortProductsBySpecQueue(products.filter(needsSpecWork));
  }
  return sortProductsBySpecQueue(
    products.filter((product) => resolveProductSpecStatus(product) === filter),
  );
}

export function RndSpecQueueView() {
  const products = useLiveProducts();
  const { user, roleLabel } = useAuth();
  const [filter, setFilter] = useState<QueueFilter>("pending");

  const counts = useMemo(
    () => countProductsBySpecStatus(products),
    [products],
  );
  const pendingCount =
    counts.not_started + counts.draft + counts.need_review;

  const visible = useMemo(
    () => filterProducts(products, filter),
    [products, filter],
  );

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9F1239]">
              R&D Spec Workflow
            </p>
            <h1 className="page-title mt-1">Specification Queue</h1>
            <p className="page-description mt-1 max-w-2xl">
              MKT creates products first. R&D fills technical specs later for
              Product Resume export. Signed in as{" "}
              <span className="font-semibold text-gray-700">
                {user?.displayName ?? "User"}
              </span>{" "}
              ({roleLabel}).
            </p>
          </div>
          <div className="rounded-2xl border border-[#9F1239]/15 bg-[#9F1239]/5 px-4 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9F1239]/80">
              Needs work
            </p>
            <p className="mt-1 text-2xl font-bold text-[#9F1239]">
              {pendingCount}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            "not_started",
            "draft",
            "need_review",
            "completed",
          ] as ProductSpecStatus[]
        ).map((status) => (
          <Card key={status} padding="md" className="border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {PRODUCT_SPEC_STATUS_LABELS[status]}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {counts[status]}
            </p>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          const count =
            item.id === "pending" ? pendingCount : counts[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                active
                  ? "border-[#9F1239] bg-[#9F1239] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
              )}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <Card className="border-dashed" padding="lg">
          <div className="flex flex-col items-center py-8 text-center">
            <FlaskConical className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">
              No products in this queue
            </p>
            <p className="mt-1 text-xs text-gray-400">
              When MKT adds products, they appear here for R&D to apply specs.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((product) => {
            const status = resolveProductSpecStatus(product);
            return (
              <Card
                key={product.id}
                padding="md"
                className="border-gray-100"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <ProductImageDisplay
                      src={product.imageUrl}
                      alt={resolveProductImageAlt(product)}
                      size="sm"
                      className="p-1"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/products/${product.id}?tab=spec`}
                          className="truncate text-sm font-semibold text-gray-900 hover:text-primary"
                        >
                          {product.name}
                        </Link>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            getSpecStatusBadgeClasses(status),
                          )}
                        >
                          {PRODUCT_SPEC_STATUS_LABELS[status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatProductBrand(product.brand)}
                        {product.supplier ? ` · ${product.supplier}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        Updated {timeAgo(product.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:shrink-0">
                    <Button
                      href={`/products/${product.id}?tab=spec`}
                      size="sm"
                      variant="secondary"
                    >
                      View product
                    </Button>
                    <Link
                      href={`/products/${product.id}/spec?from=rnd`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9F1239] px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#9F1239]/90"
                    >
                      <ClipboardList className="h-4 w-4" />
                      {getSpecActionLabel(status)}
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
