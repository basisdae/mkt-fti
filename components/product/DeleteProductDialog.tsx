"use client";

import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { Button } from "@/components/ui/Button";
import { resolveProductImageAlt } from "@/lib/product-image";
import type { ProductView } from "@/types/product";

interface DeleteProductDialogProps {
  product: ProductView;
  deleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteProductDialog({
  product,
  deleting = false,
  onCancel,
  onConfirm,
}: DeleteProductDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-product-title"
        className="w-full max-w-md rounded-[24px] border border-gray-100 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="delete-product-title"
          className="text-lg font-semibold text-gray-900"
        >
          Delete Product
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
              {product.supplier?.trim() || "—"}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-fti-red">
          This action permanently deletes this product and cannot be undone.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={deleting}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={deleting}
            aria-busy={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Deleting…" : "Delete Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}
