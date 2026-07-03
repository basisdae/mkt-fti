import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRODUCT_IMAGE_SIZE_CLASSES,
  type ProductImageSize,
} from "@/lib/product-image";

interface ProductImageDisplayProps {
  src?: string | null;
  alt: string;
  size?: ProductImageSize;
  fluid?: boolean;
  className?: string;
  frameClassName?: string;
  showPlaceholder?: boolean;
}

export function ProductImageDisplay({
  src,
  alt,
  size = "md",
  fluid = false,
  className,
  frameClassName,
  showPlaceholder = true,
}: ProductImageDisplayProps) {
  const sizeClass = PRODUCT_IMAGE_SIZE_CLASSES[size];

  return (
    <div
      className={cn(
        "product-image-frame relative shrink-0 overflow-hidden rounded-2xl border border-gray-100/80",
        fluid ? "aspect-square w-full" : sizeClass,
        frameClassName,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn(
            "h-full w-full object-contain p-1.5 sm:p-2",
            className,
          )}
        />
      ) : showPlaceholder ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-300">
          <Package className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          <span className="text-[9px] font-medium uppercase tracking-wide sm:text-[10px]">
            No image
          </span>
        </div>
      ) : null}
    </div>
  );
}
