"use client";

import { Sparkles, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  brandFitScoreLabel,
  formatBrandDecisionDate,
  formatFtiBrand,
  FTI_BRAND_LABELS,
} from "@/lib/brand-strategy";
import { cn } from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface BrandStrategyCardProps {
  product: ProductView;
  className?: string;
}

export function BrandStrategyCard({ product, className }: BrandStrategyCardProps) {
  const strategy = product.brandStrategy;

  return (
    <Card
      padding="lg"
      className={cn(
        "border-primary/10 bg-gradient-to-br from-light-purple/20 via-card to-white",
        className,
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Brand Strategy
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Brand decision support — assignment optional until launch readiness
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white/80 px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Current Brand
          </p>
          <p className="mt-1.5 text-lg font-bold text-gray-900">
            {formatFtiBrand(strategy.currentBrand)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white/80 px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Business Unit
          </p>
          <p className="mt-1.5 text-sm font-semibold text-gray-800">
            {strategy.businessUnit}
          </p>
        </div>

        <div className="sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Candidate Brands
          </p>
          {strategy.candidateBrands.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
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
            <p className="mt-2 text-sm italic text-gray-400">
              No alternate candidates — brand locked or undecided.
            </p>
          )}
        </div>

        <div className="sm:col-span-2 rounded-xl border border-gray-100 bg-white/80 px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Reason
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {strategy.reason || "No decision rationale recorded yet."}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white/80 px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Decision Date
          </p>
          <p className="mt-1.5 text-sm font-semibold text-gray-800">
            {formatBrandDecisionDate(strategy.decisionDate)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white/80 px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Owner
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <User className="h-3.5 w-3.5 text-gray-400" />
            {strategy.owner || "Unassigned"}
          </p>
        </div>

        <div className="sm:col-span-2 rounded-xl border border-dashed border-primary/20 bg-light-purple/15 px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Brand Fit Score
          </p>
          <p className="mt-1.5 text-sm font-medium text-gray-600">
            {brandFitScoreLabel(strategy.brandFitScore)}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            Reserved for future scoring model — channel fit, margin, and brand
            architecture alignment.
          </p>
        </div>
      </div>
    </Card>
  );
}
