import { ChevronDown } from "lucide-react";
import { formatFtiBrand } from "@/lib/brand-strategy";
import { cn } from "@/lib/utils";
import type { ProductBrandStrategy } from "@/types/product";

interface BrandContextStackProps {
  strategy: ProductBrandStrategy;
  compact?: boolean;
  className?: string;
}

export function BrandContextStack({
  strategy,
  compact = false,
  className,
}: BrandContextStackProps) {
  const currentLabel = strategy.currentBrand
    ? formatFtiBrand(strategy.currentBrand)
    : "Brand TBD";

  return (
    <div
      className={cn(
        "brand-context-stack rounded-xl border border-gray-100/80 bg-gradient-to-br from-gray-50/80 to-white px-3 py-2.5",
        compact && "px-2.5 py-2",
        className,
      )}
    >
      <p
        className={cn(
          "truncate font-medium text-gray-800",
          compact ? "text-[11px]" : "text-xs",
        )}
        title={strategy.factory}
      >
        {strategy.factory}
      </p>
      <ChevronDown
        className="my-0.5 h-3 w-3 text-primary/35"
        strokeWidth={2.5}
        aria-hidden
      />
      <p
        className={cn(
          "truncate text-gray-600",
          compact ? "text-[11px]" : "text-xs",
        )}
        title={strategy.internalProjectName}
      >
        {strategy.internalProjectName}
      </p>
      <ChevronDown
        className="my-0.5 h-3 w-3 text-primary/35"
        strokeWidth={2.5}
        aria-hidden
      />
      <p
        className={cn(
          "truncate font-semibold",
          strategy.currentBrand ? "text-primary" : "italic text-gray-400",
          compact ? "text-[11px]" : "text-xs",
        )}
      >
        {currentLabel}
      </p>
    </div>
  );
}
