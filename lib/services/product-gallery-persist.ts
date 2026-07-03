import {
  getProductImageStorage,
  isSupabaseStorageUploadReady,
} from "@/lib/product-image-storage";
import {
  insertProductImages,
  listProductImages,
  replaceProductImages,
  updateProductCoverFields,
} from "@/lib/services/product-images";
import {
  appendGalleryFiles,
  normalizeGalleryItems,
  revokeGalleryPreviewUrls,
  syncCoverFields,
  type ProductGalleryItem,
} from "@/lib/product-gallery";
import type { ProductGalleryImage } from "@/types/product";

function isPersistedUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return !url.startsWith("blob:") && !url.startsWith("data:");
}

async function prepareItemForUpload(
  productId: string,
  productName: string,
  item: ProductGalleryItem,
): Promise<ProductGalleryImage> {
  const storage = getProductImageStorage();

  if (item.file) {
    const uploaded = await storage.upload({
      file: item.file,
      productId,
      productName,
      alt: item.alt,
    });
    revokeGalleryPreviewUrls([item]);

    return {
      id: item.id,
      url: uploaded.imageUrl,
      imagePath: uploaded.imagePath,
      alt: uploaded.imageAlt,
      sortOrder: item.sortOrder,
      isCover: item.isCover,
      imageType: item.imageType,
      usageTags: item.usageTags,
    };
  }

  if (!isPersistedUrl(item.url)) {
    throw new Error(
      `Could not upload "${item.alt || "gallery image"}". Please remove it and try again.`,
    );
  }

  return {
    id: item.id,
    url: item.url,
    imagePath: item.imagePath ?? null,
    alt: item.alt,
    sortOrder: item.sortOrder,
    isCover: item.isCover,
    imageType: item.imageType,
    usageTags: item.usageTags,
  };
}

export async function uploadProductGallery(
  productId: string,
  productName: string,
  items: ProductGalleryItem[],
): Promise<ProductGalleryImage[]> {
  if (!isSupabaseStorageUploadReady()) {
    throw new Error("Image upload requires Supabase Storage.");
  }

  const normalized = normalizeGalleryItems(items);
  if (normalized.length === 0) return [];

  const prepared: ProductGalleryImage[] = [];
  for (const item of normalized) {
    prepared.push(await prepareItemForUpload(productId, productName, item));
  }

  const saved = await replaceProductImages(productId, prepared);
  const cover = syncCoverFields(saved, productName);
  await updateProductCoverFields(productId, cover.imageUrl, cover.imageAlt);

  return saved;
}

export async function syncProductGallery(
  productId: string,
  productName: string,
  items: ProductGalleryItem[],
): Promise<ProductGalleryImage[]> {
  if (!isSupabaseStorageUploadReady()) {
    throw new Error("Image upload requires Supabase Storage.");
  }

  const normalized = normalizeGalleryItems(items);
  const existing = await listProductImages(productId);
  const storage = getProductImageStorage();

  const nextIds = new Set(normalized.map((item) => item.id));
  const removed = existing.filter((image) => !nextIds.has(image.id));

  for (const image of removed) {
    if (image.imagePath) {
      await storage.remove(productId, image.imagePath);
    }
  }

  if (normalized.length === 0) {
    await replaceProductImages(productId, []);
    await updateProductCoverFields(productId, null, "");
    return [];
  }

  const prepared: ProductGalleryImage[] = [];
  for (const item of normalized) {
    prepared.push(await prepareItemForUpload(productId, productName, item));
  }

  const saved = await replaceProductImages(productId, prepared);
  const cover = syncCoverFields(saved, productName);
  await updateProductCoverFields(productId, cover.imageUrl, cover.imageAlt);

  return saved;
}

/** Upload only new files and append to existing gallery — existing rows stay untouched. */
export async function appendNewGalleryImages(
  productId: string,
  productName: string,
  existingItems: ProductGalleryItem[],
  files: File[],
): Promise<ProductGalleryItem[]> {
  if (!isSupabaseStorageUploadReady()) {
    throw new Error("Image upload requires Supabase Storage.");
  }

  const { items: withPending, errors } = appendGalleryFiles(
    existingItems,
    files,
    productName,
  );

  const newPending = withPending.filter((item) => item.file);
  if (newPending.length === 0) {
    if (errors.length > 0) {
      throw new Error(errors.join(" · "));
    }
    return existingItems.map((item) => ({
      ...item,
      file: null,
      saveStatus: "saved" as const,
    }));
  }

  const uploaded: ProductGalleryImage[] = [];
  for (const item of newPending) {
    uploaded.push(await prepareItemForUpload(productId, productName, item));
  }

  await insertProductImages(productId, uploaded);

  const refreshed = await listProductImages(productId);
  return markGalleryItemsSaved(refreshed);
}

export function galleryItemsNeedUpload(items: ProductGalleryItem[]): boolean {
  return items.some((item) => Boolean(item.file));
}

export function hasInvalidGalleryItems(items: ProductGalleryItem[]): boolean {
  return items.some(
    (item) =>
      Boolean(item.file) === false &&
      Boolean(item.url) &&
      !isPersistedUrl(item.url),
  );
}

export async function loadGalleryItemsForProduct(
  productId: string,
  fallback: {
    images?: ProductGalleryImage[];
    imageUrl: string | null;
    imageAlt: string;
    name: string;
  },
): Promise<ProductGalleryItem[]> {
  if (!isSupabaseStorageUploadReady()) {
    return import("@/lib/product-gallery").then((m) =>
      m.galleryItemsFromProduct(fallback),
    );
  }

  try {
    const images = await listProductImages(productId);
    if (images.length > 0) {
      return images.map((image) => ({
        ...image,
        file: null,
        saveStatus: "saved" as const,
      }));
    }
  } catch {
    // Fall back to embedded product data
  }

  const { galleryItemsFromProduct } = await import("@/lib/product-gallery");
  return galleryItemsFromProduct(fallback);
}

export function markGalleryItemsUploading(
  items: ProductGalleryItem[],
): ProductGalleryItem[] {
  return items.map((item) =>
    item.file ? { ...item, saveStatus: "uploading" as const } : item,
  );
}

export function markGalleryItemsSaved(
  images: ProductGalleryImage[],
): ProductGalleryItem[] {
  return images.map((image) => ({
    ...image,
    file: null,
    saveStatus: "saved" as const,
  }));
}

export function markGalleryItemsFailed(
  items: ProductGalleryItem[],
): ProductGalleryItem[] {
  return items.map((item) =>
    item.file || item.saveStatus === "uploading"
      ? { ...item, saveStatus: "failed" as const }
      : item,
  );
}
