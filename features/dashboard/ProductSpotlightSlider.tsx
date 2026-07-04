"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useMemo, useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { EvaluationScoreBadge } from "@/components/product/EvaluationScoreBadge";
import { Card } from "@/components/ui/Card";
import { formatProductBrand } from "@/lib/brand-strategy";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { getProfitSummary } from "@/lib/product-detail";
import { resolveProductImageAlt } from "@/lib/product-image";
import { cn, formatCurrencyTHB, formatDate, getStatusColor } from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface ProductSpotlightSliderProps {
  products: ProductView[];
  className?: string;
}

interface SpotlightCardProps {
  product: ProductView;
  rank: number;
  featured?: boolean;
}

function SpotlightCard({ product, rank, featured = false }: SpotlightCardProps) {
  const statusStyle = getStatusColor(product.status);
  const recommended = useMemo(() => {
    if (!product.priceOptions.length) return null;
    return getProfitSummary(product.priceOptions).recommended;
  }, [product.priceOptions]);

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group relative flex shrink-0 snap-start flex-col",
        featured ? "w-[260px] sm:w-[300px]" : "w-[240px] sm:w-[260px]",
      )}
    >
      <article
        className={cn(
          "spotlight-card flex h-full flex-col overflow-hidden rounded-[22px] border bg-card transition-all duration-500 ease-out",
          featured
            ? "origin-left scale-[1.04] border-primary/20 shadow-[0_20px_50px_-16px_rgb(105_92_255_0.35),0_8px_20px_-8px_rgb(17_24_39_0.08)] hover:border-primary/30 hover:shadow-[0_24px_56px_-14px_rgb(105_92_255_0.4)]"
            : "scale-100 border-gray-100/90 shadow-[0_10px_28px_-14px_rgb(17_24_39_0.12)] hover:-translate-y-1 hover:border-primary/15 hover:shadow-[0_16px_36px_-12px_rgb(105_92_255_0.18)]",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            featured
              ? "bg-gradient-to-br from-light-purple/80 via-white to-primary/[0.06]"
              : "bg-gradient-to-br from-light-purple/35 via-white to-gray-50/70",
          )}
        >
          <div
            className={cn(
              "absolute left-3 top-3 z-10 flex items-center justify-center rounded-full font-bold text-white shadow-lg",
              featured
                ? "h-8 min-w-8 bg-primary px-2.5 text-sm shadow-primary/35"
                : "h-7 min-w-7 bg-primary/90 px-2 text-xs shadow-primary/25",
            )}
          >
            #{rank}
          </div>
          <ProductImageDisplay
            src={product.imageUrl}
            alt={resolveProductImageAlt(product)}
            fluid
            frameClassName="rounded-none border-0 bg-transparent aspect-[4/3]"
            className={cn(
              "object-contain p-4 sm:p-5",
              featured && "p-5 sm:p-6",
            )}
          />
        </div>

        <div
          className={cn(
            "flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3",
            featured && "px-5 pb-5 pt-4",
          )}
        >
          <div>
            <h3
              className={cn(
                "line-clamp-2 font-semibold leading-snug text-gray-900 group-hover:text-primary",
                featured ? "text-[15px] sm:text-base" : "text-sm",
              )}
            >
              {product.name}
            </h3>
            <p className="mt-1 truncate text-xs font-medium text-gray-700">
              {formatProductBrand(product.brand)}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {product.supplier?.trim() || "—"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusStyle.badge} className={statusStyle.bg}>
              {PRODUCT_STATUS_LABELS[product.status]}
            </Badge>
            <EvaluationScoreBadge
              scorecard={product.evaluationScorecard}
              compact
            />
          </div>

          <div className="mt-auto space-y-2 rounded-xl bg-light-purple/35 px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Recommended MOQ
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {recommended
                    ? `${recommended.tier.moq.toLocaleString()} units`
                    : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Selling price
                </p>
                <p className="mt-0.5 text-sm font-bold text-primary">
                  {recommended
                    ? formatCurrencyTHB(recommended.pricing.ftiSellingPrice)
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400">
            Updated {formatDate(product.updatedAt)}
          </p>
        </div>
      </article>
    </Link>
  );
}

export function ProductSpotlightSlider({
  products,
  className,
}: ProductSpotlightSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -320 : 320;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className={cn(className)}>
      <Card
        padding="none"
        className="overflow-hidden border-primary/10 bg-gradient-to-br from-light-purple/25 via-card to-white shadow-[0_12px_40px_-20px_rgb(105_92_255_0.25)]"
      >
        <div className="flex flex-col gap-1 border-b border-gray-100/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Product Spotlight
              </h2>
              <p className="text-xs text-gray-500">
                Ranked by score · latest updates break ties
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 sm:mt-0">
            <button
              type="button"
              aria-label="Scroll spotlight left"
              onClick={() => scrollBy("left")}
              className="rounded-xl border border-gray-200/80 bg-white/90 p-2.5 text-gray-500 shadow-sm transition-all hover:border-primary/30 hover:bg-light-purple/50 hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll spotlight right"
              onClick={() => scrollBy("right")}
              className="rounded-xl border border-gray-200/80 bg-white/90 p-2.5 text-gray-500 shadow-sm transition-all hover:border-primary/30 hover:bg-light-purple/50 hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white/90 to-transparent sm:w-14"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white/90 to-transparent sm:w-14"
            aria-hidden
          />

          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-5 py-6 pl-7 scroll-smooth sm:gap-5 sm:px-6 sm:py-7 sm:pl-10"
          >
            {products.map((product, index) => (
              <SpotlightCard
                key={product.id}
                product={product}
                rank={index + 1}
                featured={index === 0}
              />
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
