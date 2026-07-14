"use client";

import Link from "next/link";
import { Building2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProductCardTitle } from "@/components/product/ProductCardTitle";
import { EvaluationScoreBadge } from "@/components/product/EvaluationScoreBadge";
import { useBrandStore } from "@/hooks/BrandStore";
import { FTI_BRAND_LABELS, FTI_BRAND_OPTIONS, formatFtiBrand } from "@/lib/brand-strategy";
import { cn } from "@/lib/utils";
import type { FtiBrand, ProductView } from "@/types/product";

interface BrandBoardCardProps {
  product: ProductView;
  columnBrand: FtiBrand | "unassigned";
  className?: string;
}

export function BrandBoardCard({
  product,
  columnBrand,
  className,
}: BrandBoardCardProps) {
  const { setCurrentBrand, setBrandReason } = useBrandStore();
  const strategy = product.brandStrategy;

  return (
    <Card padding="md" className={cn("shadow-sm", className)}>
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/products/${product.id}`}
          className="min-w-0 flex-1 hover:text-primary"
        >
          <ProductCardTitle as="span">{product.name}</ProductCardTitle>
        </Link>
        <EvaluationScoreBadge
          scorecard={product.evaluationScorecard}
          compact
          showStatus
        />
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {product.supplier || "No supplier linked"}
        </span>
      </p>

      <div className="mt-3 space-y-2">
        <div>
          <label
            htmlFor={`brand-${product.id}`}
            className="text-[11px] font-semibold uppercase tracking-wide text-gray-400"
          >
            Current Brand
          </label>
          <select
            id={`brand-${product.id}`}
            value={strategy.currentBrand ?? ""}
            onChange={(e) =>
              setCurrentBrand(
                product.id,
                e.target.value ? (e.target.value as FtiBrand) : null,
              )
            }
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Undecided</option>
            {FTI_BRAND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Candidate Brands
          </p>
          {strategy.candidateBrands.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {strategy.candidateBrands.map((brand) => (
                <Badge
                  key={brand}
                  variant={
                    strategy.currentBrand === brand ? "success" : "default"
                  }
                  className={
                    strategy.currentBrand === brand
                      ? ""
                      : "bg-light-purple/50 text-primary"
                  }
                >
                  {FTI_BRAND_LABELS[brand]}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-xs italic text-gray-400">None listed</p>
          )}
        </div>

        <div>
          <label
            htmlFor={`reason-${product.id}`}
            className="text-[11px] font-semibold text-gray-500"
          >
            เหตุผลที่เหมาะกับแบรนด์นี้
          </label>
          <textarea
            id={`reason-${product.id}`}
            value={strategy.reason}
            onChange={(e) => setBrandReason(product.id, e.target.value)}
            rows={2}
            placeholder={
              columnBrand !== "unassigned"
                ? `ทำไมสินค้านี้เหมาะกับ ${FTI_BRAND_LABELS[columnBrand]}...`
                : "บันทึกเหตุผลการตัดสินใจแบรนด์..."
            }
            className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {strategy.currentBrand && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-success">
          <Sparkles className="h-3 w-3" />
          Assigned: {formatFtiBrand(strategy.currentBrand)}
        </p>
      )}
    </Card>
  );
}
