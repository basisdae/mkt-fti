import { cn } from "@/lib/utils";

type ProductCardTitleSize = "sm" | "base";

const sizeClass: Record<ProductCardTitleSize, string> = {
  /** text-sm + leading-snug → 2 lines */
  sm: "text-sm min-h-[2.40625rem]",
  /** text-base + leading-snug → 2 lines */
  base: "text-base min-h-[2.75rem]",
};

/** Two-line product name for cards and list rows — breaks long SKUs before clamping. */
export function productCardTitleClassName(
  size: ProductCardTitleSize = "sm",
  className?: string,
) {
  return cn(
    "line-clamp-2 break-words font-semibold leading-snug text-gray-900 [overflow-wrap:anywhere]",
    sizeClass[size],
    className,
  );
}

interface ProductCardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: "h3" | "p" | "span";
  size?: ProductCardTitleSize;
}

export function ProductCardTitle({
  children,
  className,
  as: Tag = "h3",
  size = "sm",
}: ProductCardTitleProps) {
  return (
    <Tag className={productCardTitleClassName(size, className)}>
      {children}
    </Tag>
  );
}
