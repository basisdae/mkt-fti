import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Single shared bucket — never create supplier-logos. */
const BUCKET = "product-images";

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
] as const;

const MAX_BYTES = 5 * 1024 * 1024;

export function validateSupplierLogoFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
    return "Logo must be PNG, JPG, SVG, or WebP.";
  }
  if (file.size > MAX_BYTES) {
    return "Logo must be 5 MB or smaller.";
  }
  return null;
}

export const SUPPLIER_LOGO_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.svg";

function extensionFromFile(file: File): string {
  const fromName = file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "jpg";
  }
}

export function publicSupplierLogoUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

function publicUrl(path: string): string {
  return publicSupplierLogoUrl(path);
}

/** suppliers/{supplierId}/logo-{timestamp}.{ext} */
function buildLogoPath(supplierId: string, file: File): string {
  const ext = extensionFromFile(file);
  return `suppliers/${supplierId}/logo-${Date.now()}.${ext}`;
}

export async function uploadSupplierLogo(
  supplierId: string,
  file: File,
): Promise<{ logoUrl: string; logoPath: string }> {
  const validationError = validateSupplierLogoFile(file);
  if (validationError) throw new Error(validationError);
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured for logo upload.");
  }

  const supabase = createClient();
  const path = buildLogoPath(supplierId, file);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  return {
    logoUrl: publicUrl(path),
    logoPath: path,
  };
}

export async function removeSupplierLogo(logoPath: string | null | undefined) {
  if (!logoPath?.trim() || !isSupabaseConfigured()) return;

  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([logoPath]);
  if (error) throw new Error(error.message);
}
