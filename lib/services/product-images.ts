import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  ProductGalleryImage,
  ProductImageType,
  ProductImageUsageTag,
} from "@/types/product";

function getClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return createClient();
}

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function isMissingMetaColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("image_type") ||
    lower.includes("usage_tags") ||
    (lower.includes("column") && lower.includes("does not exist"))
  );
}

function parseUsageTags(value: unknown): ProductImageUsageTag[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is ProductImageUsageTag =>
      typeof item === "string",
    );
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parseUsageTags(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

function mapRow(row: {
  id: string;
  image_url: string;
  image_path: string | null;
  alt_text: string;
  sort_order: number;
  is_cover: boolean;
  image_type?: string | null;
  usage_tags?: unknown;
}): ProductGalleryImage {
  return {
    id: row.id,
    url: row.image_url,
    imagePath: row.image_path,
    alt: row.alt_text ?? "",
    sortOrder: row.sort_order ?? 0,
    isCover: Boolean(row.is_cover),
    imageType: (row.image_type as ProductImageType) ?? "",
    usageTags: parseUsageTags(row.usage_tags),
  };
}

function toDbRows(
  productId: string,
  images: ProductGalleryImage[],
  includeMeta: boolean,
) {
  return images.map((image) => {
    const row: Record<string, unknown> = {
      id: image.id,
      product_id: productId,
      image_url: image.url,
      image_path: image.imagePath ?? null,
      alt_text: image.alt,
      sort_order: image.sortOrder,
      is_cover: image.isCover,
    };
    if (includeMeta) {
      row.image_type = image.imageType ?? "";
      row.usage_tags = image.usageTags ?? [];
    }
    return row;
  });
}

async function insertRows(
  productId: string,
  images: ProductGalleryImage[],
): Promise<ProductGalleryImage[]> {
  if (images.length === 0) return [];

  const supabase = getClient();
  const withMeta = toDbRows(productId, images, true);
  const firstAttempt = await supabase
    .from("product_images")
    .insert(withMeta)
    .select();

  if (!firstAttempt.error) {
    return (firstAttempt.data ?? []).map(mapRow);
  }

  if (!isMissingMetaColumnError(firstAttempt.error.message)) {
    throw new Error(firstAttempt.error.message);
  }

  // Columns not applied yet — keep existing images working without meta.
  const fallback = await supabase
    .from("product_images")
    .insert(toDbRows(productId, images, false))
    .select();

  throwOnError(fallback.error);
  return (fallback.data ?? []).map((row) => {
    const mapped = mapRow(row as Parameters<typeof mapRow>[0]);
    const source = images.find((image) => image.id === mapped.id);
    return {
      ...mapped,
      imageType: source?.imageType ?? "",
      usageTags: source?.usageTags ?? [],
    };
  });
}

async function upsertRows(
  productId: string,
  images: ProductGalleryImage[],
): Promise<ProductGalleryImage[]> {
  if (images.length === 0) return [];

  const supabase = getClient();
  const withMeta = toDbRows(productId, images, true);
  const firstAttempt = await supabase
    .from("product_images")
    .upsert(withMeta, { onConflict: "id" })
    .select();

  if (!firstAttempt.error) {
    return (firstAttempt.data ?? []).map(mapRow);
  }

  if (!isMissingMetaColumnError(firstAttempt.error.message)) {
    throw new Error(firstAttempt.error.message);
  }

  const fallback = await supabase
    .from("product_images")
    .upsert(toDbRows(productId, images, false), { onConflict: "id" })
    .select();

  throwOnError(fallback.error);
  return (fallback.data ?? []).map((row) => {
    const mapped = mapRow(row as Parameters<typeof mapRow>[0]);
    const source = images.find((image) => image.id === mapped.id);
    return {
      ...mapped,
      imageType: source?.imageType ?? "",
      usageTags: source?.usageTags ?? [],
    };
  });
}

export async function listProductImages(productId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  throwOnError(error);
  return (data ?? []).map(mapRow);
}

/** All gallery rows grouped by product_id — used to hydrate list/detail cover after refresh. */
export async function listAllProductGalleryGrouped(): Promise<
  Map<string, ProductGalleryImage[]>
> {
  const supabase = getClient();
  const { data, error } = await supabase.from("product_images").select("*");

  throwOnError(error);

  const sorted = [...(data ?? [])].sort((a, b) => {
    const productCompare = String(a.product_id).localeCompare(
      String(b.product_id),
    );
    if (productCompare !== 0) return productCompare;
    return (a.sort_order as number) - (b.sort_order as number);
  });

  const grouped = new Map<string, ProductGalleryImage[]>();
  for (const row of sorted) {
    const productId = row.product_id as string;
    const images = grouped.get(productId) ?? [];
    images.push(mapRow(row as Parameters<typeof mapRow>[0]));
    grouped.set(productId, images);
  }
  return grouped;
}

/** Insert new gallery rows without removing existing ones. */
export async function insertProductImages(
  productId: string,
  images: ProductGalleryImage[],
) {
  return insertRows(productId, images);
}

/**
 * Sync gallery rows for a product.
 * Upserts first, then deletes removed ids — existing images stay if write fails.
 */
export async function replaceProductImages(
  productId: string,
  images: ProductGalleryImage[],
) {
  const existing = await listProductImages(productId);
  const nextIds = new Set(images.map((image) => image.id));
  const removedIds = existing
    .filter((image) => !nextIds.has(image.id))
    .map((image) => image.id);

  const saved = await upsertRows(productId, images);

  if (removedIds.length > 0) {
    await deleteProductImagesByIds(removedIds);
  }

  if (images.length === 0) return [];
  return saved;
}

/** Update a single image's metadata. */
export async function updateProductImage(
  imageId: string,
  patch: Partial<
    Pick<
      ProductGalleryImage,
      "alt" | "imageType" | "isCover" | "sortOrder" | "usageTags"
    >
  >,
) {
  const supabase = getClient();
  const dbPatch: Record<string, unknown> = {};
  if (patch.alt !== undefined) dbPatch.alt_text = patch.alt;
  if (patch.imageType !== undefined) dbPatch.image_type = patch.imageType;
  if (patch.isCover !== undefined) dbPatch.is_cover = patch.isCover;
  if (patch.sortOrder !== undefined) dbPatch.sort_order = patch.sortOrder;
  if (patch.usageTags !== undefined) dbPatch.usage_tags = patch.usageTags;

  const { error } = await supabase
    .from("product_images")
    .update(dbPatch)
    .eq("id", imageId);

  if (error && isMissingMetaColumnError(error.message)) {
    const fallbackPatch: Record<string, unknown> = {};
    if (patch.alt !== undefined) fallbackPatch.alt_text = patch.alt;
    if (patch.isCover !== undefined) fallbackPatch.is_cover = patch.isCover;
    if (patch.sortOrder !== undefined) fallbackPatch.sort_order = patch.sortOrder;
    if (Object.keys(fallbackPatch).length === 0) return;

    const fallback = await supabase
      .from("product_images")
      .update(fallbackPatch)
      .eq("id", imageId);
    throwOnError(fallback.error);
    return;
  }

  throwOnError(error);
}

export async function deleteProductImagesByIds(ids: string[]) {
  if (ids.length === 0) return;

  const supabase = getClient();
  const { error } = await supabase.from("product_images").delete().in("id", ids);
  throwOnError(error);
}

export async function updateProductCoverFields(
  productId: string,
  imageUrl: string | null,
  imageAlt: string,
) {
  const supabase = getClient();
  const { error } = await supabase
    .from("products")
    .update({
      image_url: imageUrl,
      image_alt: imageAlt,
    })
    .eq("id", productId);

  throwOnError(error);
}
