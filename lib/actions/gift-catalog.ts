"use server";

import {
  canEditGiftPlans,
  canExportGiftPlans,
  canViewGiftPlans,
} from "@/lib/auth/permissions";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import {
  isValidReferenceUrl,
  normalizeReferenceUrl,
} from "@/lib/gift-catalog-url";
import { mapGiftCatalogDbError } from "@/lib/gift-catalog-db-errors";
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

function failDb<T>(context: string, detail: string): ActionResult<T> {
  return fail(mapGiftCatalogDbError(context, detail));
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
    return fail(t.noPermissionGiftCatalog);
  }
  return { ok: true, data: { user, supabase } };
}

async function requireEdit(): Promise<
  ActionResult<{ user: AppUser; supabase: SupabaseClient }>
> {
  const view = await requireView();
  if (!view.ok) return view;
  if (!canEditGiftPlans(view.data.user)) {
    return fail(t.noPermissionEditGiftCatalog);
  }
  return view;
}

function mapRow(row: Record<string, unknown>): GiftCatalogRow {
  const mapped = row as unknown as GiftCatalogRow;
  return {
    ...mapped,
    reference_url: mapped.reference_url ?? null,
    operational_status: mapped.operational_status ?? "interested",
  };
}

function normalizeInput(input: GiftCatalogInput) {
  const referenceUrl = normalizeReferenceUrl(input.reference_url);
  if (referenceUrl && !isValidReferenceUrl(referenceUrl)) {
    throw new Error(t.referenceUrlInvalid);
  }
  return {
    gift_name: input.gift_name.trim(),
    internal_code: input.internal_code?.trim() || null,
    category: input.category,
    source: input.source,
    description: input.description.trim(),
    reference_url: referenceUrl,
    operational_status: input.operational_status,
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
  if (error) return failDb("listGiftCatalog", error.message);
  return { ok: true, data: (data ?? []).map(mapRow) };
}

export async function saveGiftCatalogAction(input: {
  id?: string;
  values: GiftCatalogInput;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  let values;
  try {
    values = normalizeInput(input.values);
  } catch (err) {
    return fail(err instanceof Error ? err.message : t.referenceUrlInvalid);
  }
  if (!values.gift_name) return fail(t.giftNameRequired);

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
    if (error) return failDb("saveGiftCatalog.update", error.message);
    return { ok: true, data: { id: input.id } };
  }

  const { data, error } = await supabase
    .from("gift_catalog")
    .insert({
      ...values,
      image_url: null,
      image_path: null,
      created_by_email: user.email,
      updated_by_email: user.email,
    })
    .select("id")
    .single();

  if (error) {
    return failDb("saveGiftCatalog.insert", error.message);
  }
  if (!data) return fail(t.catalogCreateFailed);
  return { ok: true, data: { id: data.id as string } };
}

export async function updateGiftCatalogImageAction(input: {
  id: string;
  imagePath: string | null;
  imageUrl: string | null;
}): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { error } = await auth.data.supabase
    .from("gift_catalog")
    .update({
      image_path: input.imagePath,
      image_url: input.imageUrl,
      updated_by_email: auth.data.user.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) return failDb("updateGiftCatalogImage", error.message);
  return { ok: true, data: null };
}

export async function getGiftCatalogImagePathAction(
  id: string,
): Promise<ActionResult<{ imagePath: string | null }>> {
  const auth = await requireView();
  if (!auth.ok) return auth;

  const { data, error } = await auth.data.supabase
    .from("gift_catalog")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  if (error) return failDb("getGiftCatalogImagePath", error.message);
  if (!data) return fail(t.catalogNotFound);
  return {
    ok: true,
    data: { imagePath: (data.image_path as string | null) ?? null },
  };
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

  if (loadError) return failDb("duplicateGiftCatalog.load", loadError.message);
  if (!row) return fail(t.catalogNotFound);

  const source = mapRow(row);
  return saveGiftCatalogAction({
    values: {
      gift_name: `${source.gift_name} (สำเนา)`,
      internal_code: null,
      category: source.category,
      source: source.source,
      description: source.description,
      image_url: null,
      image_path: null,
      unit: source.unit,
      default_actual_cost: Number(source.default_actual_cost),
      default_estimated_gift_value: Number(source.default_estimated_gift_value),
      supplier_name: source.supplier_name,
      specification: source.specification,
      notes: source.notes,
      status: "active",
      reference_url: null,
      operational_status: "interested",
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

  if (error) return failDb("setGiftCatalogStatus", error.message);
  return { ok: true, data: null };
}

export async function deleteGiftCatalogAction(
  id: string,
): Promise<ActionResult<{ imagePath: string | null }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { data: row } = await auth.data.supabase
    .from("gift_catalog")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  const imagePath = (row?.image_path as string | null) ?? null;

  const { error } = await auth.data.supabase
    .from("gift_catalog")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return fail(t.catalogInUseArchive);
    }
    return failDb("deleteGiftCatalog", error.message);
  }
  return { ok: true, data: { imagePath } };
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

  if (error) return failDb("isGiftCatalogInUse", error.message);
  return { ok: true, data: (count ?? 0) > 0 };
}
