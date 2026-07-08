import { generateId } from "@/lib/generate-id";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  removeSupplierGalleryImage,
  uploadSupplierGalleryImage,
} from "@/lib/supplier-gallery-storage";
import { publicSupplierLogoUrl } from "@/lib/supplier-logo-storage";
import type {
  SupplierGalleryCategory,
  SupplierGalleryImage,
} from "@/types/supplier";

const CATEGORIES = new Set<SupplierGalleryCategory>([
  "factory_visit",
  "production_line",
  "warehouse",
  "laboratory",
  "showroom",
  "certificate",
  "office",
  "other",
]);

function mapRow(row: Record<string, unknown>): SupplierGalleryImage {
  const category = String(row.category ?? "factory_visit");
  const path = String(row.image_path ?? "");
  const url = String(row.image_url ?? "").trim();
  return {
    id: String(row.id),
    supplierId: String(row.supplier_id),
    imageUrl: url || (path ? publicSupplierLogoUrl(path) : ""),
    imagePath: path,
    altText: String(row.alt_text ?? ""),
    category: CATEGORIES.has(category as SupplierGalleryCategory)
      ? (category as SupplierGalleryCategory)
      : "other",
    sortOrder: Number(row.sort_order) || 0,
    isCover: row.is_cover === true,
  };
}

export async function listAllSupplierGalleryImages(): Promise<
  Map<string, SupplierGalleryImage[]>
> {
  if (!isSupabaseConfigured()) return new Map();

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("supplier_gallery_images")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("supplier_gallery_images") ||
        message.includes("does not exist")
      ) {
        return new Map();
      }
      throw new Error(error.message);
    }

    const map = new Map<string, SupplierGalleryImage[]>();
    for (const row of data ?? []) {
      const image = mapRow(row as Record<string, unknown>);
      const list = map.get(image.supplierId) ?? [];
      list.push(image);
      map.set(image.supplierId, list);
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function listSupplierGalleryImages(
  supplierId: string,
): Promise<SupplierGalleryImage[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("supplier_gallery_images")
      .select("*")
      .eq("supplier_id", supplierId)
      .order("sort_order", { ascending: true });

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("supplier_gallery_images") ||
        message.includes("does not exist")
      ) {
        return [];
      }
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export type SupplierGalleryDraftItem = {
  /** Existing DB id, or temp id for pending uploads. */
  id: string;
  previewUrl: string;
  imagePath?: string;
  file?: File;
  category: SupplierGalleryCategory;
  altText: string;
  isCover: boolean;
  /** Mark existing image for deletion on save. */
  removed?: boolean;
};

/**
 * Persist gallery: upload new files, delete removed, rewrite rows with order/cover.
 */
export async function syncSupplierGallery(
  supplierId: string,
  items: SupplierGalleryDraftItem[],
): Promise<SupplierGalleryImage[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const active = items.filter((item) => !item.removed);
  const removed = items.filter((item) => item.removed && item.imagePath);

  for (const item of removed) {
    await removeSupplierGalleryImage(item.imagePath).catch(() => undefined);
  }

  const existing = await listSupplierGalleryImages(supplierId);
  const activeIds = new Set(
    active.filter((item) => !item.file).map((item) => item.id),
  );
  for (const image of existing) {
    if (!activeIds.has(image.id)) {
      await removeSupplierGalleryImage(image.imagePath).catch(() => undefined);
    }
  }

  const supabase = createClient();
  await supabase
    .from("supplier_gallery_images")
    .delete()
    .eq("supplier_id", supplierId);

  if (active.length === 0) return [];

  const rows: Record<string, unknown>[] = [];
  let coverAssigned = false;

  for (let index = 0; index < active.length; index++) {
    const item = active[index]!;
    let imageUrl = item.previewUrl;
    let imagePath = item.imagePath ?? "";

    if (item.file) {
      const uploaded = await uploadSupplierGalleryImage(supplierId, item.file);
      imageUrl = uploaded.imageUrl;
      imagePath = uploaded.imagePath;
    }

    const isCover = item.isCover && !coverAssigned;
    if (isCover) coverAssigned = true;

    rows.push({
      id: item.file ? generateId() : item.id,
      supplier_id: supplierId,
      image_url: imageUrl,
      image_path: imagePath,
      alt_text: item.altText.trim(),
      category: item.category,
      sort_order: index,
      is_cover: isCover || (!coverAssigned && index === 0),
    });
  }

  // Ensure exactly one cover (first image).
  if (rows.length > 0 && !rows.some((row) => row.is_cover === true)) {
    rows[0]!.is_cover = true;
  }

  const { data, error } = await supabase
    .from("supplier_gallery_images")
    .insert(rows)
    .select();

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}
