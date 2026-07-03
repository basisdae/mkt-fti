"use client";

import { Sparkles } from "lucide-react";
import { PageEmptyState } from "@/components/empty/PageEmptyState";
import { BrandBoardView } from "@/features/brand/BrandBoardView";
import { useBrandStore } from "@/hooks/BrandStore";

export function BrandBoardPageView() {
  const { productsWithBrand } = useBrandStore();

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Brand Decision Support
          </span>
        </div>
        <h1 className="page-title">Brand Board</h1>
        <p className="page-description">
          Products grouped by candidate brand — assign current brand and record
          rationale locally
        </p>
      </div>

      {productsWithBrand.length === 0 ? (
        <PageEmptyState
          icon={Sparkles}
          title="ยังไม่มีสินค้าใน Brand Board"
          description="เพิ่มสินค้าเพื่อจัดกลุ่มและตัดสินใจแบรนด์"
        />
      ) : (
        <BrandBoardView products={productsWithBrand} />
      )}
    </div>
  );
}
