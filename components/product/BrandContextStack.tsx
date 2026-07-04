import {
  Building2,
  ChevronDown,
  ChevronRight,
  Package,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { formatFtiBrand } from "@/lib/brand-strategy";
import { cn } from "@/lib/utils";
import type { ProductBrandStrategy } from "@/types/product";

interface BrandContextStackProps {
  strategy: ProductBrandStrategy;
  compact?: boolean;
  className?: string;
}

type HierarchyTone = "supplier" | "product" | "brand" | "brand-pending";

interface HierarchyLevel {
  icon: LucideIcon;
  label: string;
  title?: string;
  tone: HierarchyTone;
}

function HierarchyItem({
  icon: Icon,
  label,
  title,
  compact,
  tone,
}: HierarchyLevel & { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Icon
        className={cn(
          "shrink-0 text-gray-400",
          compact ? "h-3 w-3" : "h-3.5 w-3.5",
        )}
        aria-hidden
      />
      <p
        className={cn(
          "min-w-0 truncate",
          compact ? "text-[11px]" : "text-xs",
          tone === "supplier" && "font-medium text-gray-800",
          tone === "product" && "text-gray-600",
          tone === "brand" && "font-semibold text-primary",
          tone === "brand-pending" && "italic text-gray-400",
        )}
        title={title ?? label}
      >
        {label}
      </p>
    </div>
  );
}

export function BrandContextStack({
  strategy,
  compact = false,
  className,
}: BrandContextStackProps) {
  const levels: HierarchyLevel[] = [
    {
      icon: Building2,
      label: strategy.factory || "—",
      title: strategy.factory,
      tone: "supplier",
    },
    {
      icon: Package,
      label: strategy.internalProjectName || "—",
      title: strategy.internalProjectName,
      tone: "product",
    },
    {
      icon: Tag,
      label: strategy.currentBrand
        ? formatFtiBrand(strategy.currentBrand)
        : "Brand TBD",
      tone: strategy.currentBrand ? "brand" : "brand-pending",
    },
  ];

  return (
    <div
      className={cn(
        "brand-context-stack rounded-xl border border-gray-100/80 bg-gradient-to-br from-gray-50/80 to-white px-3 py-2.5",
        compact && "px-2.5 py-2",
        className,
      )}
    >
      {/* Mobile — vertical stack */}
      <div
        className="flex flex-col md:hidden"
        aria-label="Supplier, product, brand"
      >
        {levels.map((level, index) => (
          <div key={`mobile-${level.tone}`}>
            {index > 0 && (
              <ChevronDown
                className={cn(
                  "mx-auto text-primary/35",
                  compact ? "my-0.5 h-3 w-3" : "my-1 h-3.5 w-3.5",
                )}
                aria-hidden
              />
            )}
            <HierarchyItem {...level} compact={compact} />
          </div>
        ))}
      </div>

      {/* Desktop — horizontal breadcrumb */}
      <div
        className="hidden min-w-0 items-center gap-1.5 md:flex"
        aria-label="Supplier, product, brand"
      >
        {levels.map((level, index) => (
          <div
            key={`desktop-${level.tone}`}
            className="flex min-w-0 items-center gap-1.5"
          >
            {index > 0 && (
              <ChevronRight
                className={cn(
                  "shrink-0 text-primary/35",
                  compact ? "h-3 w-3" : "h-3.5 w-3.5",
                )}
                aria-hidden
              />
            )}
            <HierarchyItem {...level} compact={compact} />
          </div>
        ))}
      </div>
    </div>
  );
}
