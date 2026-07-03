"use client";

import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { EvaluationScoreBadge } from "@/components/product/EvaluationScoreBadge";
import { Card } from "@/components/ui/Card";
import {
  getEvaluationStatusBadgeClasses,
  getEvaluationStatusLabel,
  getEvaluationTotalScore,
} from "@/lib/evaluation-scorecard";
import { resolveProductImageAlt } from "@/lib/product-image";
import { cn } from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface TopCandidateProductsCardProps {
  products: ProductView[];
  limit?: number;
  className?: string;
}

export function TopCandidateProductsCard({
  products,
  limit = 5,
  className,
}: TopCandidateProductsCardProps) {
  const topScored = [...products]
    .sort(
      (a, b) =>
        getEvaluationTotalScore(b.evaluationScorecard) -
        getEvaluationTotalScore(a.evaluationScorecard),
    )
    .slice(0, limit);

  if (topScored.length === 0) return null;

  return (
    <Card
      padding="none"
      className={cn(
        "overflow-hidden border-primary/10 shadow-[0_8px_32px_-12px_rgb(105_92_255_0.12)]",
        className,
      )}
    >
      <div className="border-b border-gray-100/80 bg-gradient-to-r from-light-purple/25 via-white to-light-purple/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Top 5 Candidate Products
            </h2>
            <p className="text-xs text-gray-500">
              ผลิตภัณฑ์คะแนนประเมินสูงสุด · Strong Candidate ขึ้นไป
            </p>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-gray-50">
        {topScored.map((product, index) => {
          const totalScore = getEvaluationTotalScore(
            product.evaluationScorecard,
          );
          const statusLabel = getEvaluationStatusLabel(totalScore);
          return (
            <li key={product.id}>
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-light-purple/20 sm:px-6"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">
                  {index + 1}
                </span>
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
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      getEvaluationStatusBadgeClasses(totalScore),
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>
                <EvaluationScoreBadge
                  scorecard={product.evaluationScorecard}
                  compact
                />
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-gray-300 sm:block" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** @deprecated Use TopCandidateProductsCard */
export const TopScoredProductsCard = TopCandidateProductsCard;
