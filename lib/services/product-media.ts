import { isProductMediaType } from "@/lib/product-media";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { generateId } from "@/lib/generate-id";
import type { ProductMediaLink, ProductMediaType } from "@/types/product";

function getClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createClient();
}

function mapRow(row: Record<string, unknown>): ProductMediaLink {
  const mediaType = String(row.type ?? row.media_type ?? "source_page");
  const sourcePage = String(row.source_page_url ?? "");
  const url = String(row.url ?? "");
  const active =
    row.active !== undefined ? row.active !== false : row.is_active !== false;

  return {
    id: String(row.id),
    productId: String(row.product_id),
    title: String(row.title ?? ""),
    mediaType: isProductMediaType(mediaType) ? mediaType : "source_page",
    // Prefer source_page_url for open/link behavior when present.
    url: (sourcePage || url).trim(),
    embedUrl: String(row.embed_url ?? ""),
    platform: String(row.platform ?? ""),
    videoId: String(row.video_reference_id ?? row.video_id ?? ""),
    videoFileName: String(row.video_file_name ?? ""),
    coverImageUrl: String(row.cover_image_url ?? ""),
    duration: String(row.duration ?? ""),
    isActive: active,
    sortOrder: Number(row.sort_order) || 0,
    remark: String(row.remark ?? ""),
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toRow(link: ProductMediaLink): Record<string, unknown> {
  const sourcePage = link.url.trim();
  return {
    id: link.id,
    product_id: link.productId,
    title: link.title.trim(),
    type: link.mediaType,
    platform: link.platform.trim(),
    url: sourcePage,
    embed_url: emptyToNull(link.embedUrl),
    source_page_url: emptyToNull(sourcePage),
    video_reference_id: emptyToNull(link.videoId),
    video_file_name: emptyToNull(link.videoFileName),
    cover_image_url: emptyToNull(link.coverImageUrl),
    duration: emptyToNull(link.duration),
    remark: emptyToNull(link.remark),
    active: link.isActive,
    sort_order: link.sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export async function listAllProductMediaLinks(): Promise<
  Map<string, ProductMediaLink[]>
> {
  if (!isSupabaseConfigured()) return new Map();

  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("product_media_links")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("product_media_links") ||
        message.includes("schema cache") ||
        message.includes("does not exist")
      ) {
        return new Map();
      }
      throw new Error(error.message);
    }

    const map = new Map<string, ProductMediaLink[]>();
    for (const row of data ?? []) {
      const link = mapRow(row as Record<string, unknown>);
      const list = map.get(link.productId) ?? [];
      list.push(link);
      map.set(link.productId, list);
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function listProductMediaLinks(
  productId: string,
): Promise<ProductMediaLink[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("product_media_links")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("product_media_links") ||
        message.includes("schema cache") ||
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

export async function saveProductMediaLinks(
  productId: string,
  links: ProductMediaLink[],
): Promise<ProductMediaLink[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = getClient();
  const normalized = links.map((link, index) => ({
    ...link,
    id: link.id || generateId(),
    productId,
    sortOrder: index,
  }));

  const { error: deleteError } = await supabase
    .from("product_media_links")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    const message = deleteError.message.toLowerCase();
    if (
      message.includes("product_media_links") ||
      message.includes("schema cache") ||
      message.includes("does not exist")
    ) {
      throw new Error(
        "Table public.product_media_links is missing. Run migration 20260704170000_product_media_links_canonical.sql in the Supabase SQL Editor, then retry.",
      );
    }
    throw new Error(deleteError.message);
  }

  if (normalized.length === 0) return [];

  const { data, error } = await supabase
    .from("product_media_links")
    .insert(normalized.map(toRow))
    .select();

  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("product_media_links") ||
      message.includes("schema cache") ||
      message.includes("does not exist")
    ) {
      throw new Error(
        "Table public.product_media_links is missing. Run migration 20260704170000_product_media_links_canonical.sql in the Supabase SQL Editor, then retry.",
      );
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export type { ProductMediaType };
