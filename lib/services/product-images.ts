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
  alt_text: string;
  sort_order: number;
  is_cover: boolean;
}): ProductGalleryImage {
  return {
    id: row.id,
    url: row.image_url,
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
