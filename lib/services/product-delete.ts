import { createClient } from "@/lib/supabase/client";
import { getProductImageStorage } from "@/lib/product-image-storage";
import { isProductSupabaseEnabled } from "@/lib/services/product-persist";
import { listProductImages } from "@/lib/services/product-images";

/**
 * Permanently deletes a product and related data.
 *
 * Prefer RPC `delete_product_fully` (single DB transaction). Falls back to
 * deleting the products row (child tables cascade). Storage objects are
 * removed after the DB delete succeeds.
 */
export async function deleteProductFully(productId: string): Promise<void> {
  if (!isProductSupabaseEnabled()) {
    return;
  }

  const imagePaths = await collectStoragePaths(productId);

  const supabase = createClient();
  const rpcResult = await supabase.rpc("delete_product_fully", {
    p_product_id: productId,
  });

  if (rpcResult.error) {
    // Graceful fallback when RPC is not installed yet.
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (error) {
      throw new Error(error.message);
    }
  }

  await removeStoragePaths(productId, imagePaths);
}

async function collectStoragePaths(productId: string): Promise<string[]> {
  try {
    const images = await listProductImages(productId);
    return images
      .map((image) => image.imagePath)
      .filter((path): path is string => Boolean(path?.trim()));
  } catch {
    return [];
  }
}

async function removeStoragePaths(
  productId: string,
  paths: string[],
): Promise<void> {
  const storage = getProductImageStorage();
  for (const path of paths) {
    try {
      await storage.remove(productId, path);
    } catch {
      // Best-effort cleanup; DB row is already gone.
    }
  }

  // Also clear any leftover objects under the product folder.
  try {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("product-images")
      .list(productId, { limit: 100 });
    const leftovers = (data ?? [])
      .map((item) => `${productId}/${item.name}`)
      .filter(Boolean);
    if (leftovers.length > 0) {
      await supabase.storage.from("product-images").remove(leftovers);
    }
  } catch {
    // ignore
  }
}
