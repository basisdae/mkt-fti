import { generateId } from "@/lib/generate-id";
import {
  defaultProductImageAlt,
  revokeProductImagePreviewUrl,
  validateProductImageFile,
} from "@/lib/product-image";
import type { ProductGalleryImage } from "@/types/product";

export type GallerySaveStatus = "unsaved" | "uploading" | "saved" | "failed";

/** Gallery item in the editor — may include a pending File before persistence. */
export interface ProductGalleryItem extends ProductGalleryImage {
  file?: File | null;
  saveStatus: GallerySaveStatus;
}

export function sortGalleryImages<T extends { sortOrder: number }>(
  images: T[],
): T[] {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCoverGalleryImage(
  images: ProductGalleryImage[],
): ProductGalleryImage | undefined {
  const sorted = sortGalleryImages(images);
  return sorted.find((image) => image.isCover) ?? sorted[0];
}

export function getCoverImageUrl(images: ProductGalleryImage[]): string | null {
  return getCoverGalleryImage(images)?.url ?? null;
}

export function getCoverImageAlt(
  images: ProductGalleryImage[],
  productName: string,
): string {
  const cover = getCoverGalleryImage(images);
  return cover?.alt?.trim() || defaultProductImageAlt(productName);
}

export function syncCoverFields(
  images: ProductGalleryImage[],
  productName: string,
): { imageUrl: string | null; imageAlt: string } {
  return {
    imageUrl: getCoverImageUrl(images),
    imageAlt: getCoverImageAlt(images, productName),
  };
}

export function galleryImagesToItems(
  images: ProductGalleryImage[],
): ProductGalleryItem[] {
  return sortGalleryImages(images).map((image) => ({
    ...image,
    saveStatus: "saved" as const,
    file: null,
  }));
}

export function galleryItemsFromProduct(product: {
  images?: ProductGalleryImage[];
  imageUrl: string | null;
  imageAlt: string;
  name: string;
}): ProductGalleryItem[] {
  if (product.images && product.images.length > 0) {
    return galleryImagesToItems(product.images);
  }
  if (product.imageUrl) {
    return galleryImagesToItems([
      {
        id: generateId(),
        url: product.imageUrl,
        alt: product.imageAlt || defaultProductImageAlt(product.name),
        sortOrder: 0,
        isCover: true,
      },
    ]);
  }
  return [];
}

export function createGalleryItemFromFile(
  file: File,
  productName: string,
  sortOrder: number,
  isCover: boolean,
): ProductGalleryItem {
  return {
    id: generateId(),
    url: URL.createObjectURL(file),
    alt: defaultProductImageAlt(productName),
    sortOrder,
    isCover,
    file,
    saveStatus: "unsaved",
  };
}

export function normalizeGalleryItems(items: ProductGalleryItem[]): ProductGalleryItem[] {
  const sorted = sortGalleryImages(items);
  if (sorted.length === 0) return [];

  const hasCover = sorted.some((item) => item.isCover);
  return sorted.map((item, index) => ({
    ...item,
    sortOrder: index,
    isCover: hasCover ? item.isCover : index === 0,
  }));
}

export function setGalleryCover(
  items: ProductGalleryItem[],
  imageId: string,
): ProductGalleryItem[] {
  return normalizeGalleryItems(
    items.map((item) => ({
      ...item,
      isCover: item.id === imageId,
      saveStatus:
        item.id === imageId || item.isCover
          ? ("unsaved" as const)
          : item.saveStatus,
    })),
  );
}

export function removeGalleryItem(
  items: ProductGalleryItem[],
  imageId: string,
): ProductGalleryItem[] {
  const target = items.find((item) => item.id === imageId);
  if (target) revokeProductImagePreviewUrl(target.url);

  return normalizeGalleryItems(items.filter((item) => item.id !== imageId));
}

export function updateGalleryItemAlt(
  items: ProductGalleryItem[],
  imageId: string,
  alt: string,
): ProductGalleryItem[] {
  return items.map((item) =>
    item.id === imageId
      ? { ...item, alt, saveStatus: "unsaved" as const }
      : item,
  );
}

export function appendGalleryFiles(
  items: ProductGalleryItem[],
  files: File[],
  productName: string,
): { items: ProductGalleryItem[]; errors: string[] } {
  const errors: string[] = [];
  const next = [...items];
  const hasCover = next.some((item) => item.isCover);
  let sortOrder =
    next.length === 0
      ? 0
      : Math.max(...next.map((item) => item.sortOrder), next.length - 1) + 1;

  for (const file of files) {
    const validationError = validateProductImageFile(file);
    if (validationError) {
      errors.push(`${file.name}: ${validationError}`);
      continue;
    }

    next.push(
      createGalleryItemFromFile(
        file,
        productName,
        sortOrder,
        !hasCover && next.length === 0,
      ),
    );
    sortOrder += 1;
  }

  return { items: normalizeGalleryItems(next), errors };
}

export function revokeGalleryPreviewUrls(items: ProductGalleryItem[]) {
  for (const item of items) {
    revokeProductImagePreviewUrl(item.url);
  }
}

export type GalleryStatusTone = "neutral" | "info" | "success" | "danger";

export function galleryItemStatusLabel(item: ProductGalleryItem): string {
  switch (item.saveStatus) {
    case "uploading":
      return "Uploading...";
    case "saved":
      return "Saved";
    case "failed":
      return "Upload failed";
    case "unsaved":
    default:
      return "Ready to upload";
  }
}

export function galleryItemStatusTone(item: ProductGalleryItem): GalleryStatusTone {
  switch (item.saveStatus) {
    case "uploading":
      return "info";
    case "saved":
      return "success";
    case "failed":
      return "danger";
    case "unsaved":
    default:
      return "neutral";
  }
}

export function itemsFromPersistedImages(
  images: ProductGalleryImage[],
): ProductGalleryItem[] {
  return galleryImagesToItems(images);
}
