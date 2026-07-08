"use client";

import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { Button } from "@/components/ui/Button";
import { resolveProductImageAlt } from "@/lib/product-image";
import type { ProductView } from "@/types/product";

interface ArchiveProductDialogProps {
  product: ProductView;
  archiving?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ArchiveProductDialog({
  product,
  archiving = false,
  onCancel,
  onConfirm,
}: ArchiveProductDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-product-title"
        className="w-full max-w-md rounded-[24px] border border-gray-100 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Recommended
        </p>
        <h2
          id="archive-product-title"
          className="mt-1 text-lg font-semibold text-gray-900"
        >
          Archive this product?
        </h2>

        <div className="mt-4 flex gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
          <ProductImageDisplay
            src={product.imageUrl}
            alt={resolveProductImageAlt(product)}
            size="sm"
            className="p-1"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {product.name}
            </p>
            <p className="mt-1 truncate text-xs text-gray-500">
              {product.code?.trim() || "—"}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          <span className="font-semibold text-gray-900">{product.name}</span>{" "}
          will be hidden from the product catalog. Related data is kept. This is
          safer than permanent delete.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={archiving}
            data-shortcut-close
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={archiving}
            aria-busy={archiving}
            onClick={onConfirm}
          >
            {archiving ? "Archiving…" : "Archive Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}
