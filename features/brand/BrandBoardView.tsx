"use client";

import { useMemo } from "react";
import { BrandBoardCard } from "@/components/brand/BrandBoardCard";
import {
  BRAND_BOARD_COLUMNS,
  groupProductsByBrandColumn,
  type BrandBoardColumnId,
} from "@/lib/brand-board";
import { cn } from "@/lib/utils";
import type { ProductView } from "@/types/product";

const COLUMN_ACCENTS: Record<BrandBoardColumnId, string> = {
  aquatek: "border-t-sky-400",
  variia: "border-t-primary",
  fastpure: "border-t-emerald-400",
  uni_pure: "border-t-violet-400",
  treatton: "border-t-amber-400",
  unassigned: "border-t-gray-300",
};

interface BrandBoardViewProps {
  products: ProductView[];
}

export function BrandBoardView({ products }: BrandBoardViewProps) {
  const grouped = useMemo(
    () => groupProductsByBrandColumn(products),
    [products],
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {BRAND_BOARD_COLUMNS.map((column) => {
        const items = grouped[column.id];
        return (
          <div
            key={column.id}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-[20px] border border-gray-100 bg-white/80 shadow-sm",
              "border-t-4",
              COLUMN_ACCENTS[column.id],
            )}
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                {column.label}
              </h2>
              <p className="text-xs text-gray-400">
                {items.length} product{items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex max-h-[calc(100dvh-16rem)] flex-col gap-3 overflow-y-auto p-3">
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-400">
                  No products in this column
                </p>
              ) : (
                items.map((product) => (
                  <BrandBoardCard
                    key={`${column.id}-${product.id}`}
                    product={product}
                    columnBrand={column.id}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
