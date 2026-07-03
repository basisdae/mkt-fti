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

export async function listPipelineLogs(productId?: string) {
  const supabase = getClient();
  let query = supabase
    .from("pipeline_logs")
    .select("*")
    .order("updated_at", { ascending: false });

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  throwOnError(error);
  return data ?? [];
}

export async function createPipelineLog(record: Record<string, unknown>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("pipeline_logs")
    .insert(record)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function deletePipelineLog(id: string) {
  const supabase = getClient();
  const { error } = await supabase.from("pipeline_logs").delete().eq("id", id);
  throwOnError(error);
}

export async function listNotes(productId?: string) {
  const supabase = getClient();
  let query = supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  throwOnError(error);
  return data ?? [];
}

export async function createNote(record: Record<string, unknown>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("notes")
    .insert(record)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function updateNote(
  id: string,
  patch: Record<string, unknown>,
) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("notes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function deleteNote(id: string) {
  const supabase = getClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  throwOnError(error);
}
