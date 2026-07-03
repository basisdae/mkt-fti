"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, StickyNote } from "lucide-react";
import { Select } from "@/components/forms/Select";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { ProductNotesPanel } from "@/components/product/ProductNotesPanel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { useProductNotesStore } from "@/hooks/ProductNotesStore";
import { resolveProductImageAlt } from "@/lib/product-image";

export function ProductNotesView() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product") ?? "prod-001";

  const products = useLiveProducts();
  const { noteCountForProduct } = useProductNotesStore();
  const [productId, setProductId] = useState(initialProductId);

  const product = useMemo(
    () => products.find((p) => p.id === productId) ?? products[0],
    [products, productId],
  );

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  if (!product) return null;

  const noteCount = noteCountForProduct(product.id);

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <h1 className="page-title">Product Notes</h1>
        <p className="page-description">
          Rich notes, factory comments, negotiation logs, and meeting summaries
          — with PDF, Excel, and image attachments.
        </p>
      </div>

      <Card className="mb-6" padding="lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <ProductImageDisplay
              src={product.imageUrl}
              alt={resolveProductImageAlt(product)}
              size="md"
              className="p-1.5"
            />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={product.status} />
                <span className="text-xs text-gray-400">{product.code}</span>
              </div>
              <h2 className="truncate text-lg font-bold text-gray-900">
                {product.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{product.supplier}</p>
              <p className="mt-2 text-xs text-gray-400">
                {noteCount} {noteCount === 1 ? "note" : "notes"} on file
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[260px]">
            <Select
              label="Product"
              options={productOptions}
              value={product.id}
              onChange={(e) => setProductId(e.target.value)}
            />
            <Button
              href={`/products/${product.id}`}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Product detail
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-light-purple text-primary">
            <StickyNote className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Notes & files</h2>
            <p className="text-xs text-gray-500">
              Drag and drop PDF, Excel, or images when composing a note
            </p>
          </div>
        </div>

        <ProductNotesPanel productId={product.id} />
      </Card>

      <p className="mt-6 text-center text-xs text-gray-400">
        Mock storage only — files stay in local state until backend is wired.{" "}
        <Link href="/timeline" className="font-medium text-primary hover:underline">
          View timeline
        </Link>
      </p>
    </div>
  );
}
