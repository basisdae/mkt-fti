/** Accepted MIME types for product artwork uploads. */
export const ACCEPTED_PRODUCT_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ACCEPTED_PRODUCT_IMAGE_ACCEPT =
  ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export type ProductImageSize = "sm" | "md" | "lg" | "xl";

export const PRODUCT_IMAGE_SIZE_CLASSES: Record<ProductImageSize, string> = {
  sm: "h-12 w-12",
  md: "h-16 w-16 sm:h-[72px] sm:w-[72px]",
  lg: "h-32 w-32 sm:h-40 sm:w-40",
  xl: "h-48 w-48 sm:h-56 sm:w-56 lg:h-64 lg:w-64",
};

export function validateProductImageFile(file: File): string | null {
  if (!ACCEPTED_PRODUCT_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_PRODUCT_IMAGE_TYPES)[number])) {
    return "Use PNG, JPG, or WebP only.";
  }
  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

export function createProductImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeProductImagePreviewUrl(url: string | null | undefined) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function defaultProductImageAlt(productName: string): string {
  return `${productName.trim()} product image`;
}
