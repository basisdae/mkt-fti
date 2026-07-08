import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { publicSupplierLogoUrl } from "@/lib/supplier-logo-storage";

const BUCKET = "product-images";

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

const MAX_BYTES = 10 * 1024 * 1024;

export const SUPPLIER_GALLERY_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp";

export function validateSupplierGalleryFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
    return "Gallery images must be PNG, JPG, or WebP.";
  }
  if (file.size > MAX_BYTES) {
    return "Each gallery image must be 10 MB or smaller.";
  }
  return null;
}

function extensionFromFile(file: File): string {
  const fromName = file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

/** suppliers/{supplierId}/gallery/{timestamp}-{rand}.{ext} */
function buildGalleryPath(supplierId: string, file: File): string {
  const ext = extensionFromFile(file);
  const rand = Math.random().toString(36).slice(2, 8);
  return `suppliers/${supplierId}/gallery/${Date.now()}-${rand}.${ext}`;
}

export async function uploadSupplierGalleryImage(
  supplierId: string,
  file: File,
): Promise<{ imageUrl: string; imagePath: string }> {
  const validationError = validateSupplierGalleryFile(file);
  if (validationError) throw new Error(validationError);
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured for gallery upload.");
  }

  const supabase = createClient();
  const path = buildGalleryPath(supplierId, file);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  return {
    imageUrl: publicSupplierLogoUrl(path),
    imagePath: path,
  };
}

export async function removeSupplierGalleryImage(
  imagePath: string | null | undefined,
): Promise<void> {
  if (!imagePath?.trim() || !isSupabaseConfigured()) return;
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([imagePath]);
  if (error) throw new Error(error.message);
}
