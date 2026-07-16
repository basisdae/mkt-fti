"use server";

import {
  canEditGiftPlans,
  canExportGiftPlans,
  canViewGiftPlans,
} from "@/lib/auth/permissions";
import { getAuthenticatedSupabaseForActions } from "@/lib/supabase/authenticated-server";
import type { GiftCatalogInput, GiftCatalogRow } from "@/types/gift-catalog";
import type { AppUser } from "@/types/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail<T>(error: string): ActionResult<T> {
  return { ok: false, error };
}

async function requireView(): Promise<
  ActionResult<{ user: AppUser; supabase: SupabaseClient }>
> {
  const auth = await getAuthenticatedSupabaseForActions();
  if (!auth.ok) return fail(auth.error);
  const { user, supabase } = auth.data;
  if (
    !canViewGiftPlans(user) &&
    !canEditGiftPlans(user) &&
    !canExportGiftPlans(user)
  ) {
    return fail("You do not have permission to access gift catalog.");
  }
  return { ok: true, data: { user, supabase } };
}

async function requireEdit(): Promise<
  ActionResult<{ user: AppUser; supabase: SupabaseClient }>
> {
  const view = await requireView();
  if (!view.ok) return view;
  if (!canEditGiftPlans(view.data.user)) {
    return fail("You do not have permission to edit gift catalog.");
  }
  return view;
}

function mapRow(row: Record<string, unknown>): GiftCatalogRow {
  return row as unknown as GiftCatalogRow;
}

function normalizeInput(input: GiftCatalogInput) {
  return {
    gift_name: input.gift_name.trim(),
    internal_code: input.internal_code?.trim() || null,
    category: input.category,
    source: input.source,
    description: input.description.trim(),
    image_url: input.image_url?.trim() || null,
    unit: input.unit.trim() || "piece",
    default_actual_cost: input.default_actual_cost,
    default_estimated_gift_value: input.default_estimated_gift_value,
    supplier_name: input.supplier_name?.trim() || null,
    specification: input.specification.trim(),
    notes: input.notes.trim(),
    status: input.status,
  };
}

export async function listGiftCatalogAction(options?: {
  includeArchived?: boolean;
}): Promise<ActionResult<GiftCatalogRow[]>> {
  const auth = await requireView();
  if (!auth.ok) return auth;

  let query = auth.data.supabase
    .from("gift_catalog")
    .select("*")
    .order("updated_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;
  if (error) return fail(error.message);
  return { ok: true, data: (data ?? []).map(mapRow) };
}

export async function saveGiftCatalogAction(input: {
  id?: string;
  values: GiftCatalogInput;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const values = normalizeInput(input.values);
  if (!values.gift_name) return fail("Gift name is required.");

  const { user, supabase } = auth.data;
  const now = new Date().toISOString();

  if (input.id) {
    const { error } = await supabase
      .from("gift_catalog")
      .update({
        ...values,
        updated_by_email: user.email,
        updated_at: now,
      })
      .eq("id", input.id);
    if (error) return fail(error.message);
    return { ok: true, data: { id: input.id } };
  }

  const { data, error } = await supabase
    .from("gift_catalog")
    .insert({
      ...values,
      created_by_email: user.email,
      updated_by_email: user.email,
    })
    .select("id")
    .single();

  if (error || !data) return fail(error?.message ?? "Could not create catalog item.");
  return { ok: true, data: { id: data.id as string } };
}

export async function duplicateGiftCatalogAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { data: row, error: loadError } = await auth.data.supabase
    .from("gift_catalog")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !row) return fail("Catalog item not found.");

  const source = mapRow(row);
  return saveGiftCatalogAction({
    values: {
      gift_name: `${source.gift_name} Copy`,
      internal_code: null,
      category: source.category,
      source: source.source,
      description: source.description,
      image_url: source.image_url,
      unit: source.unit,
      default_actual_cost: Number(source.default_actual_cost),
      default_estimated_gift_value: Number(source.default_estimated_gift_value),
      supplier_name: source.supplier_name,
      specification: source.specification,
      notes: source.notes,
      status: "active",
    },
  });
}

export async function setGiftCatalogStatusAction(
  id: string,
  status: GiftCatalogInput["status"],
): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { error } = await auth.data.supabase
    .from("gift_catalog")
    .update({
      status,
      updated_by_email: auth.data.user.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return fail(error.message);
  return { ok: true, data: null };
}

export async function deleteGiftCatalogAction(
  id: string,
): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { error } = await auth.data.supabase
    .from("gift_catalog")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return fail(
        "This catalog item is used in a gift plan. Archive it instead of deleting.",
      );
    }
    return fail(error.message);
  }
  return { ok: true, data: null };
}

export async function isGiftCatalogInUseAction(
  id: string,
): Promise<ActionResult<boolean>> {
  const auth = await requireView();
  if (!auth.ok) return auth;

  const { count, error } = await auth.data.supabase
    .from("gift_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("gift_catalog_id", id);

  if (error) return fail(error.message);
  return { ok: true, data: (count ?? 0) > 0 };
}
