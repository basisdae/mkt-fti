import { generateId } from "@/lib/generate-id";
import { isProductRelationType } from "@/lib/product-related";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProductRelatedLink, ProductRelationType } from "@/types/product";

function getClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createClient();
}

function isMissingTableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("product_related_links") ||
    lower.includes("schema cache") ||
    lower.includes("does not exist")
  );
}

function mapRow(row: Record<string, unknown>): ProductRelatedLink {
  const relationType = String(row.relation_type ?? "compatible");
  return {
    id: String(row.id),
    productId: String(row.product_id),
    relatedProductId: String(row.related_product_id),
    relationType: isProductRelationType(relationType)
      ? relationType
      : "compatible",
    sortOrder: Number(row.sort_order) || 0,
  };
}

function toRow(link: ProductRelatedLink): Record<string, unknown> {
  return {
    id: link.id,
    product_id: link.productId,
    related_product_id: link.relatedProductId,
    relation_type: link.relationType,
    sort_order: link.sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export interface ProductRelatedLinkSet {
  outgoing: ProductRelatedLink[];
  incoming: ProductRelatedLink[];
}

export async function listAllProductRelatedLinks(): Promise<
  ProductRelatedLink[]
> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("product_related_links")
      .select("*")
      .order("product_id", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      if (isMissingTableError(error.message)) {
        return [];
      }
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function listProductRelatedLinkSet(
  productId: string,
): Promise<ProductRelatedLinkSet> {
  if (!isSupabaseConfigured()) {
    return { outgoing: [], incoming: [] };
  }

  try {
    const supabase = getClient();
    const [outgoingRes, incomingRes] = await Promise.all([
      supabase
        .from("product_related_links")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("product_related_links")
        .select("*")
        .eq("related_product_id", productId)
        .order("sort_order", { ascending: true }),
    ]);

    if (outgoingRes.error && !isMissingTableError(outgoingRes.error.message)) {
      throw new Error(outgoingRes.error.message);
    }
    if (incomingRes.error && !isMissingTableError(incomingRes.error.message)) {
      throw new Error(incomingRes.error.message);
    }

    if (
      outgoingRes.error &&
      isMissingTableError(outgoingRes.error.message)
    ) {
      return { outgoing: [], incoming: [] };
    }

    return {
      outgoing: (outgoingRes.data ?? []).map((row) =>
        mapRow(row as Record<string, unknown>),
      ),
      incoming: (incomingRes.data ?? []).map((row) =>
        mapRow(row as Record<string, unknown>),
      ),
    };
  } catch {
    return { outgoing: [], incoming: [] };
  }
}

export async function saveProductRelatedLinks(
  productId: string,
  links: ProductRelatedLink[],
): Promise<ProductRelatedLink[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = getClient();
  const normalized: ProductRelatedLink[] = [];
  const orderByType: Record<ProductRelationType, number> = {
    consumable: 0,
    spare_part: 0,
    accessory: 0,
    compatible: 0,
    bundle: 0,
  };

  for (const link of links) {
    if (link.relatedProductId === productId) continue;
    const relationType = isProductRelationType(link.relationType)
      ? link.relationType
      : "compatible";
    normalized.push({
      id: link.id || generateId(),
      productId,
      relatedProductId: link.relatedProductId,
      relationType,
      sortOrder: orderByType[relationType]++,
    });
  }

  const { error: deleteError } = await supabase
    .from("product_related_links")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    if (isMissingTableError(deleteError.message)) {
      throw new Error(
        "Table public.product_related_links is missing. Run migration 20260714120000_product_related_links.sql in the Supabase SQL Editor, then retry.",
      );
    }
    throw new Error(deleteError.message);
  }

  if (normalized.length === 0) return [];

  const { data, error } = await supabase
    .from("product_related_links")
    .insert(normalized.map(toRow))
    .select();

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error(
        "Table public.product_related_links is missing. Run migration 20260714120000_product_related_links.sql in the Supabase SQL Editor, then retry.",
      );
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}
