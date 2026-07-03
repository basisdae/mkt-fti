import { generateId } from "@/lib/generate-id";
import {
  defaultProductImageAlt,
  revokeProductImagePreviewUrl,
  validateProductImageFile,
} from "@/lib/product-image";
import { isSupabaseStorageConnected } from "@/lib/product-image-storage";
import type { ProductGalleryImage } from "@/types/product";

export type GallerySaveStatus = "unsaved" | "saved" | "failed";

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
      saveStatus: item.id === imageId ? "unsaved" : item.saveStatus,
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
  let sortOrder = next.length;

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
        next.length === 0,
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

export function hasUnsavedGalleryItems(items: ProductGalleryItem[]): boolean {
  return items.some((item) => item.saveStatus === "unsaved");
}

export function hasFailedGalleryItems(items: ProductGalleryItem[]): boolean {
  return items.some((item) => item.saveStatus === "failed");
}

export function galleryStorageConnected(): boolean {
  return isSupabaseStorageConnected();
}

export function galleryStatusLabel(items: ProductGalleryItem[]): string {
  if (hasFailedGalleryItems(items)) return "Upload failed";
  if (hasUnsavedGalleryItems(items)) return "Unsaved images";
  if (items.length === 0) return "No images";
  if (galleryStorageConnected()) return "Saved";
  return "Saved locally";
}

export function galleryStatusTone(
  items: ProductGalleryItem[],
): "neutral" | "warning" | "success" | "error" {
  if (hasFailedGalleryItems(items)) return "error";
  if (hasUnsavedGalleryItems(items)) return "warning";
  if (items.length === 0) return "neutral";
  return "success";
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/** Convert pending files to persistable URLs (data URL locally until Supabase Storage). */
export async function prepareGalleryForPersistence(
  items: ProductGalleryItem[],
): Promise<ProductGalleryImage[]> {
  const normalized = normalizeGalleryItems(items);
  const prepared: ProductGalleryImage[] = [];

  for (const item of normalized) {
    let url = item.url;

    if (item.file) {
      if (galleryStorageConnected()) {
        throw new Error("Supabase Storage upload is not implemented yet.");
      }
      url = await fileToDataUrl(item.file);
      revokeProductImagePreviewUrl(item.url);
    }

    prepared.push({
      id: item.id,
      url,
      alt: item.alt,
      sortOrder: item.sortOrder,
      isCover: item.isCover,
    });
  }

  return prepared;
}

export function itemsFromPersistedImages(
  images: ProductGalleryImage[],
): ProductGalleryItem[] {
  return galleryImagesToItems(images);
}
