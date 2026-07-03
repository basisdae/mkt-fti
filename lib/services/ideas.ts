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

export async function listIdeas() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_ideas")
    .select("*")
    .order("updated_at", { ascending: false });

  throwOnError(error);
  return data ?? [];
}

export async function getIdea(id: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_ideas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwOnError(error);
  return data;
}

export async function createIdea(record: Record<string, unknown>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_ideas")
    .insert(record)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function updateIdea(
  id: string,
  patch: Record<string, unknown>,
) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("product_ideas")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function deleteIdea(id: string) {
  const supabase = getClient();
  const { error } = await supabase.from("product_ideas").delete().eq("id", id);
  throwOnError(error);
}
