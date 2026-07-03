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

export async function listScenarios() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("simulator_scenarios")
    .select("*")
    .order("updated_at", { ascending: false });

  throwOnError(error);
  return data ?? [];
}

export async function getScenario(id: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("simulator_scenarios")
    .select("*, simulator_scenario_items(*)")
    .eq("id", id)
    .maybeSingle();

  throwOnError(error);
  return data;
}

export async function createScenario(record: Record<string, unknown>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("simulator_scenarios")
    .insert(record)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function updateScenario(
  id: string,
  patch: Record<string, unknown>,
) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("simulator_scenarios")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  throwOnError(error);
  return data;
}

export async function deleteScenario(id: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from("simulator_scenarios")
    .delete()
    .eq("id", id);

  throwOnError(error);
}

export async function replaceScenarioItems(
  scenarioId: string,
  items: Record<string, unknown>[],
) {
  const supabase = getClient();

  const { error: deleteError } = await supabase
    .from("simulator_scenario_items")
    .delete()
    .eq("scenario_id", scenarioId);

  throwOnError(deleteError);

  if (items.length === 0) return [];

  const { data, error } = await supabase
    .from("simulator_scenario_items")
    .insert(items)
    .select();

  throwOnError(error);
  return data ?? [];
}
