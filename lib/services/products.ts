import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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

export async function listProducts() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  throwOnError(error);
  return data ?? [];
}

export async function getProduct(id: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwOnError(error);
  return data;
}

export async function createProduct(record: Record<string, unknown>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .insert(record)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function updateProduct(
  id: string,
  patch: Record<string, unknown>,
) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function deleteProduct(id: string) {
  const supabase = getClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  throwOnError(error);
}

export async function listProductMoqPrices(productId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_moq_prices")
    .select("*")
    .eq("product_id", productId)
    .order("moq", { ascending: true });

  throwOnError(error);
  return data ?? [];
}

export async function upsertProductMoqPrices(
  rows: Record<string, unknown>[],
) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_moq_prices")
    .upsert(rows)
    .select();

  throwOnError(error);
  return data ?? [];
}

export async function getProductScorecard(productId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_scorecards")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  throwOnError(error);
  return data;
}

export async function upsertProductScorecard(
  record: Record<string, unknown>,
) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_scorecards")
    .upsert(record)
    .select()
    .single();

  throwOnError(error);
  return data;
}
