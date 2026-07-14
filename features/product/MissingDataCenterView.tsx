"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  ImageOff,
  Package,
  RefreshCw,
  Tags,
} from "lucide-react";
import { ProductCardTitle } from "@/components/product/ProductCardTitle";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DataLoadingState } from "@/components/ui/DataStatus";
import { loadDraftProductViews } from "@/lib/services/product-load";
import { resolveProductImageAlt } from "@/lib/product-image";
import type { ProductView } from "@/types/product";

function missingItems(product: ProductView): string[] {
  const items: string[] = [];
  if (!product.brand?.trim() || product.brand === "—") items.push("Brand");
  if (!product.supplier?.trim()) items.push("Supplier");
  if (!product.moq || product.priceOptions.length === 0) items.push("MOQ");
  if (
    !product.costThb &&
    !product.ftiSellingPrice &&
    product.priceOptions.length === 0
  ) {
    items.push("Pricing");
  }
  if (!product.imageUrl && (product.images?.length ?? 0) === 0) {
    items.push("Images");
  }
  const certs = product.certification?.certifications ?? [];
  const iso = product.certification?.iso ?? [];
  if (certs.length === 0 && iso.length === 0) items.push("Certificates");
  if ((product.tagLinks?.length ?? 0) === 0 && !product.category?.trim()) {
    items.push("Classification");
  }
  return items;
}

export function MissingDataCenterView() {
  const [drafts, setDrafts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await loadDraftProductViews();
      setDrafts(rows);
    } catch (err) {
      setDrafts([]);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load draft products from the database.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const missingImages = drafts.filter(
    (p) => !p.imageUrl && !(p.images?.length),
  ).length;
  const missingCerts = drafts.filter((p) => {
    const certs = p.certification?.certifications ?? [];
    const iso = p.certification?.iso ?? [];
    return certs.length === 0 && iso.length === 0;
  }).length;

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <Link
          href="/products"
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Products
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
              Data quality
            </p>
            <h1 className="page-title mt-2">Missing Data Center</h1>
            <p className="page-description mt-2 max-w-2xl">
              Draft products loaded from Supabase (`status = draft`). Complete
              brand, supplier, pricing, images, and certificates here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button href="/products/import" size="sm" variant="secondary">
              Product Import
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {error}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SummaryTile
          icon={ClipboardList}
          label="Draft products"
          value={drafts.length}
        />
        <SummaryTile
          icon={ImageOff}
          label="Missing images"
          value={missingImages}
        />
        <SummaryTile
          icon={Tags}
          label="Missing certificates"
          value={missingCerts}
        />
      </div>

      {loading ? (
        <DataLoadingState label="Loading draft products from database…" />
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <Package className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-semibold text-gray-800">
            No draft products in the database
          </p>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            Incomplete imports are saved with status Draft and appear here.
          </p>
          <Button href="/products/import" size="sm" className="mt-4">
            Open Import Wizard
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {drafts.map((product) => {
            const missing = missingItems(product);
            return (
              <li
                key={product.id}
                className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <ProductImageDisplay
                  src={product.imageUrl}
                  alt={resolveProductImageAlt(product)}
                  size="sm"
                  className="p-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ProductCardTitle
                      as="p"
                      className="min-w-0 flex-1"
                    >
                      {product.name}
                    </ProductCardTitle>
                    <StatusBadge status={product.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {product.code || "—"}
                    {product.supplier ? ` · ${product.supplier}` : ""}
                  </p>
                  {missing.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {missing.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  href={`/products/${product.id}/edit`}
                  size="sm"
                  className="shrink-0"
                >
                  Complete
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
        {value}
      </p>
    </div>
  );
}
