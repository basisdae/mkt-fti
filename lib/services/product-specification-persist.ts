import { createClient } from "@/lib/supabase/client";
import { isProductSupabaseEnabled } from "@/lib/services/product-persist";
import { normalizeProductSpecification } from "@/lib/product-specification";
import type { ProductSpecification, ProductSpecStatus } from "@/types/product";

/**
 * Persist specification + status on products.
 * Falls back silently when columns are not installed yet.
 */
export async function saveProductSpecification(
  productId: string,
  specification: ProductSpecification,
  specStatus: ProductSpecStatus,
): Promise<void> {
  if (!isProductSupabaseEnabled()) return;

  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({
      specification: normalizeProductSpecification(specification),
      spec_status: specStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("specification") ||
      message.includes("spec_status") ||
      message.includes("column") ||
      message.includes("does not exist")
    ) {
      return;
    }
    throw new Error(error.message);
  }
}
