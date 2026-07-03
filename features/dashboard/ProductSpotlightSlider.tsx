"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { Card } from "@/components/ui/Card";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { getUnitProfit } from "@/lib/product-filters";
import { cn, formatCurrencyTHB, getStatusColor } from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface ProductSpotlightSliderProps {
  products: ProductView[];
  className?: string;
}

function getProjectedProfit(product: ProductView): number {
  return getUnitProfit(product) * product.annualVolumeTarget;
}

interface SpotlightCardProps {
  product: ProductView;
  rank: number;
  featured?: boolean;
}

function SpotlightCard({ product, rank, featured = false }: SpotlightCardProps) {
  const statusStyle = getStatusColor(product.status);
  const projectedProfit = getProjectedProfit(product);

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group relative flex shrink-0 snap-start flex-col",
        featured ? "w-[232px] sm:w-[252px]" : "w-[210px] sm:w-[228px]",
      )}
    >
      <article
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-[20px] border bg-card transition-all duration-300",
          featured
            ? "scale-[1.06] origin-left border-primary/25 shadow-[0_12px_40px_-8px_rgb(105_92_255_/_0.28)] hover:border-primary/35 hover:shadow-[0_16px_48px_-8px_rgb(105_92_255_/_0.32)]"
            : "scale-100 border-gray-100/90 shadow-sm shadow-gray-200/50 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-[var(--shadow-card-hover)]",
        )}
      >
        <div
          className={cn(
            "relative",
            featured
              ? "bg-gradient-to-br from-light-purple/70 via-white to-light-purple/30"
              : "bg-gradient-to-br from-light-purple/40 via-white to-gray-50/80",
          )}
        >
          <div className="absolute left-3 top-3 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-white shadow-md shadow-primary/30">
            #{rank}
          </div>
          <ProductImageDisplay
            src={product.imageUrl}
            alt={product.imageAlt || product.name}
            fluid
            frameClassName="rounded-none border-0 bg-transparent"
            className={cn("p-4 sm:p-5", featured && "p-5 sm:p-6")}
          />
        </div>

        <div className={cn("flex flex-1 flex-col px-4 pb-4 pt-3", featured && "px-4 pb-5")}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  "line-clamp-2 font-semibold leading-snug text-gray-900 group-hover:text-primary",
                  featured ? "text-sm sm:text-[15px]" : "text-sm",
                )}
              >
                {product.name}
              </h3>
              <p className="mt-1 truncate text-xs text-gray-500">
                {product.supplier}
              </p>
            </div>
          </div>

          <div className="mt-auto space-y-2.5">
            <div className="rounded-xl bg-light-purple/35 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Projected profit
              </p>
              <p
                className={cn(
                  "mt-0.5 font-bold text-success",
                  featured ? "text-base" : "text-sm",
                )}
              >
                {formatCurrencyTHB(projectedProfit)}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {product.annualVolumeTarget.toLocaleString()} units / yr
              </p>
            </div>

            <Badge variant={statusStyle.badge} className={statusStyle.bg}>
              {PRODUCT_STATUS_LABELS[product.status]}
            </Badge>
          </div>
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
    const amount = direction === "left" ? -280 : 280;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className={cn("mb-6 sm:mb-8", className)}>
      <Card
        padding="none"
        className="overflow-hidden border-primary/10 bg-gradient-to-br from-light-purple/30 via-card to-light-purple/10"
      >
        <div className="flex flex-col gap-1 border-b border-gray-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Product Spotlight
              </h2>
              <p className="text-xs text-gray-500">
                Top opportunities ranked by score · #1 featured on the left
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 sm:mt-0">
            <button
              type="button"
              aria-label="Scroll spotlight left"
              onClick={() => scrollBy("left")}
              className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-primary/30 hover:bg-light-purple/50 hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll spotlight right"
              onClick={() => scrollBy("right")}
              className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-primary/30 hover:bg-light-purple/50 hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-light-purple/50 to-transparent sm:w-12"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-light-purple/50 to-transparent sm:w-12"
            aria-hidden
          />

          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-5 py-5 pl-6 scroll-smooth sm:gap-5 sm:px-6 sm:py-6 sm:pl-8"
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
