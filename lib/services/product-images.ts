import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProductGalleryImage } from "@/types/product";

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

function mapRow(row: {
  id: string;
  image_url: string;
  image_path: string | null;
  alt_text: string;
  sort_order: number;
  is_cover: boolean;
}): ProductGalleryImage {
  return {
    id: row.id,
    url: row.image_url,
    imagePath: row.image_path,
    alt: row.alt_text,
    sortOrder: row.sort_order,
    isCover: row.is_cover,
  };
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

export async function replaceProductImages(
  productId: string,
  images: ProductGalleryImage[],
) {
  const supabase = getClient();

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  throwOnError(deleteError);

  if (images.length === 0) return [];

  const rows = images.map((image) => ({
    id: image.id,
    product_id: productId,
    image_url: image.url,
    image_path: image.imagePath ?? null,
    alt_text: image.alt,
    sort_order: image.sortOrder,
    is_cover: image.isCover,
  }));

  const { data, error } = await supabase
    .from("product_images")
    .insert(rows)
    .select();

  throwOnError(error);
  return (data ?? []).map(mapRow);
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
