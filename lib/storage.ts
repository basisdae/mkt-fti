/**
 * Supabase Storage integration stub.
 * Wire uploadProductImage when NEXT_PUBLIC_SUPABASE_URL is configured.
 */

export function isSupabaseStorageConnected(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export interface UploadProductImageResult {
  imageUrl: string;
  path: string;
}

/**
 * Upload product artwork to Supabase Storage.
 * Returns null when Supabase is not connected (local preview only).
 */
export async function uploadProductImage(
  _file: File,
  _productId: string,
): Promise<UploadProductImageResult | null> {
  if (!isSupabaseStorageConnected()) {
    return null;
  }

  // TODO: Supabase Storage — bucket `product-images`, path `{productId}/{filename}`
  throw new Error("Supabase Storage upload is not implemented yet.");
}
