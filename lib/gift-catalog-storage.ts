import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Shared bucket — path prefix `gift-catalog/` isolates from product/supplier assets. */
const BUCKET = "product-images";

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

const MAX_BYTES = 5 * 1024 * 1024;

export const GIFT_CATALOG_IMAGE_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp";

export function validateGiftCatalogImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
    return "รองรับเฉพาะ JPG, JPEG, PNG และ WEBP";
  }
  if (file.size > MAX_BYTES) {
    return "ขนาดไฟล์ต้องไม่เกิน 5 MB";
  }
  return null;
}

function extensionFromFile(file: File): string {
  const fromName = file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName === "jpeg" || fromName === "jpg") return "jpg";
  if (fromName === "png" || fromName === "webp") return fromName;
  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export function publicGiftCatalogImageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** gift-catalog/{giftCatalogId}/cover-{uniqueId}.{ext} */
export function buildGiftCatalogCoverPath(
  giftCatalogId: string,
  file: File,
): string {
  const ext = extensionFromFile(file);
  const uniqueId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `gift-catalog/${giftCatalogId}/cover-${uniqueId}.${ext}`;
}

export async function uploadGiftCatalogCover(
  giftCatalogId: string,
  file: File,
): Promise<{ imageUrl: string; imagePath: string }> {
  const validationError = validateGiftCatalogImageFile(file);
  if (validationError) throw new Error(validationError);
  if (!isSupabaseConfigured()) {
    throw new Error("ยังไม่ได้ตั้งค่า Supabase สำหรับอัปโหลดรูป");
  }

  const supabase = createClient();
  const path = buildGiftCatalogCoverPath(giftCatalogId, file);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  return {
    imageUrl: publicGiftCatalogImageUrl(path),
    imagePath: path,
  };
}

export async function removeGiftCatalogCover(
  imagePath: string | null | undefined,
): Promise<void> {
  if (!imagePath?.trim() || !isSupabaseConfigured()) return;

  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([imagePath]);
  if (error) throw new Error(error.message);
}
