import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SupplierLogoSize = "sm" | "md" | "detail" | "lg" | "xl";

/** Fallback surface when no logo is uploaded. */
export type SupplierLogoFallback = "default" | "onDark";

const SIZE_CLASSES: Record<
  SupplierLogoSize,
  { box: string; icon: string; padding: string }
> = {
  sm: { box: "h-10 w-10", icon: "h-5 w-5", padding: "p-1.5" },
  md: { box: "h-16 w-16", icon: "h-7 w-7", padding: "p-2" },
  /** Supplier Detail hero — matches existing square container. */
  detail: { box: "h-24 w-24", icon: "h-10 w-10", padding: "p-3" },
  lg: { box: "h-28 w-28", icon: "h-10 w-10", padding: "p-3" },
  xl: { box: "h-[118px] w-[118px]", icon: "h-12 w-12", padding: "p-4" },
};

const FALLBACK_CLASSES: Record<SupplierLogoFallback, string> = {
  default:
    "border border-dashed border-gray-200 bg-gray-50 text-gray-300",
  /** Supplier Detail hero — keep factory icon treatment on dark gradient. */
  onDark: "border border-white/10 bg-white/10 text-indigo-200",
};

interface SupplierLogoProps {
  logoUrl?: string | null;
  name: string;
  size?: SupplierLogoSize;
  fallback?: SupplierLogoFallback;
  className?: string;
  /** Extra classes on the logo image (print/PDF overrides). */
  imageClassName?: string;
}

/**
 * Supplier / company logo for detail views and document exports.
 * Falls back to the system factory icon when no logo is uploaded.
 * List cards should keep using Building2 as the system pattern.
 */
export function SupplierLogo({
  logoUrl,
  name,
  size = "lg",
  fallback = "default",
  className,
  imageClassName,
}: SupplierLogoProps) {
  const dimensions = SIZE_CLASSES[size];
  const hasLogo = Boolean(logoUrl?.trim());

  if (!hasLogo) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl",
          FALLBACK_CLASSES[fallback],
          dimensions.box,
          className,
        )}
        aria-label={`${name} factory`}
      >
        <Building2 className={dimensions.icon} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white",
        dimensions.box,
        dimensions.padding,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl!}
        alt={`${name} logo`}
        className={cn(
          "max-h-full max-w-full object-contain",
          imageClassName,
        )}
      />
    </div>
  );
}
