"use server";

import {
  canEditSeminarPlanner,
  canViewSeminarPlanner,
} from "@/lib/auth/permissions";
import {
  bulletsToJson,
  duplicateBullets,
  normalizeBullets,
} from "@/lib/seminar-planner-bullets";
import { getAuthenticatedSupabaseForActions } from "@/lib/supabase/authenticated-server";
import type { AppUser } from "@/types/auth";
import {
  SEMINAR_PLANNER_ERRORS as t,
  type SeminarLibCategoryInput,
  type SeminarLibCategoryRow,
  type SeminarLibSessionInput,
  type SeminarLibSessionRow,
  type SeminarLibSimpleMasterInput,
  type SeminarLibSimpleMasterRow,
  type SeminarLibSpeakerInput,
  type SeminarLibSpeakerRow,
  type SeminarSessionLibrarySortKey,
} from "@/types/seminar-planner";
import type { SupabaseClient } from "@supabase/supabase-js";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type ActionAuth = {
  user: AppUser;
  supabase: SupabaseClient;
};

function fail<T>(error: string): ActionResult<T> {
  return { ok: false, error };
}

async function requireView(): Promise<ActionResult<ActionAuth>> {
  const auth = await getAuthenticatedSupabaseForActions();
  if (!auth.ok) return fail(auth.error);

  const { user, supabase } = auth.data;
  if (!canViewSeminarPlanner(user) && !canEditSeminarPlanner(user)) {
    return fail(t.noPermissionView);
  }

  return { ok: true, data: { user, supabase } };
}

async function requireEdit(): Promise<ActionResult<ActionAuth>> {
  const view = await requireView();
  if (!view.ok) return view;
  if (!canEditSeminarPlanner(view.data.user)) {
    return fail(t.noPermissionEdit);
  }
  return view;
}

function mapSimpleMaster(row: Record<string, unknown>): SeminarLibSimpleMasterRow {
  return row as unknown as SeminarLibSimpleMasterRow;
}

function mapSpeaker(row: Record<string, unknown>): SeminarLibSpeakerRow {
  return row as unknown as SeminarLibSpeakerRow;
}

function mapCategory(row: Record<string, unknown>): SeminarLibCategoryRow {
  return row as unknown as SeminarLibCategoryRow;
}

function mapSession(row: Record<string, unknown>): SeminarLibSessionRow {
  const session = row as unknown as SeminarLibSessionRow;
  return {
    ...session,
    detail_bullets: normalizeBullets(session.detail_bullets),
    objectives_bullets: normalizeBullets(session.objectives_bullets),
    outcomes_bullets: normalizeBullets(session.outcomes_bullets),
    target_group_names: session.target_group_names ?? [],
    recommended_minutes:
      session.recommended_minutes === null ||
      session.recommended_minutes === undefined
        ? null
        : Number(session.recommended_minutes),
  };
}

type SimpleMasterTable =
  | "seminar_lib_target_groups"
  | "seminar_lib_purposes"
  | "seminar_lib_formats"
  | "seminar_lib_session_statuses";

type ReferenceCheck = {
  table: string;
  column: string;
};

const SIMPLE_MASTER_REFERENCES: Partial<
  Record<SimpleMasterTable, ReferenceCheck[]>
> = {
  seminar_lib_target_groups: [
    { table: "seminar_event_target_groups", column: "target_group_id" },
  ],
  seminar_lib_purposes: [
    { table: "seminar_event_purposes", column: "purpose_id" },
  ],
};

async function isReferenced(
  supabase: SupabaseClient,
  id: string,
  checks: ReferenceCheck[],
): Promise<boolean> {
  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table)
      .select("*", { count: "exact", head: true })
      .eq(check.column, id);
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) return true;
  }
  return false;
}

async function listSimpleMaster(
  supabase: SupabaseClient,
  table: SimpleMasterTable,
  options?: { includeArchived?: boolean },
): Promise<SeminarLibSimpleMasterRow[]> {
  let query = supabase
    .from(table)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!options?.includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSimpleMaster);
}

async function saveSimpleMaster(
  auth: ActionAuth,
  table: SimpleMasterTable,
  input: { id?: string; values: SeminarLibSimpleMasterInput },
): Promise<{ id: string }> {
  const name = input.values.name.trim();
  if (!name) throw new Error(t.nameRequired);

  const payload = {
    name,
    description: input.values.description?.trim() ?? "",
    sort_order: input.values.sort_order ?? 0,
    is_active: input.values.is_active ?? true,
  };
  const now = new Date().toISOString();

  if (input.id) {
    const { error } = await auth.supabase
      .from(table)
      .update({ ...payload, updated_at: now })
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return { id: input.id };
  }

  const { data, error } = await auth.supabase
    .from(table)
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? t.createFailed);
  return { id: data.id as string };
}

async function duplicateSimpleMaster(
  auth: ActionAuth,
  table: SimpleMasterTable,
  id: string,
): Promise<{ id: string }> {
  const { data: row, error } = await auth.supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) throw new Error(t.notFound);

  return saveSimpleMaster(auth, table, {
    values: {
      name: `${String(row.name)}${t.copySuffix}`,
      description: String(row.description ?? ""),
      sort_order: Number(row.sort_order ?? 0),
      is_active: Boolean(row.is_active ?? true),
    },
  });
}

async function setSimpleMasterActive(
  supabase: SupabaseClient,
  table: SimpleMasterTable,
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

async function setSimpleMasterArchived(
  supabase: SupabaseClient,
  table: SimpleMasterTable,
  id: string,
  isArchived: boolean,
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .update({
      is_archived: isArchived,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

async function deleteSimpleMaster(
  supabase: SupabaseClient,
  table: SimpleMasterTable,
  id: string,
): Promise<void> {
  const references = SIMPLE_MASTER_REFERENCES[table] ?? [];
  if (references.length > 0) {
    const inUse = await isReferenced(supabase, id, references);
    if (inUse) throw new Error(t.inUseArchive);
  }

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    if (error.code === "23503") throw new Error(t.inUseArchive);
    throw new Error(error.message);
  }
}

function wrap<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  return fn().then(
    (data) => ({ ok: true, data }),
    (err) =>
      fail<T>(err instanceof Error ? err.message : t.createFailed),
  );
}

async function withView<T>(
  fn: (auth: ActionAuth) => Promise<T>,
): Promise<ActionResult<T>> {
  const auth = await requireView();
  if (!auth.ok) return auth;
  return wrap(() => fn(auth.data));
}

async function withEdit<T>(
  fn: (auth: ActionAuth) => Promise<T>,
): Promise<ActionResult<T>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;
  return wrap(() => fn(auth.data));
}

// ---------------------------------------------------------------------------
// Target groups
// ---------------------------------------------------------------------------

export async function listTargetGroupsAction(options?: {
  includeArchived?: boolean;
}): Promise<ActionResult<SeminarLibSimpleMasterRow[]>> {
  return withView((auth) =>
    listSimpleMaster(auth.supabase, "seminar_lib_target_groups", options),
  );
}

export async function saveTargetGroupAction(input: {
  id?: string;
  values: SeminarLibSimpleMasterInput;
}): Promise<ActionResult<{ id: string }>> {
  return withEdit((auth) =>
    saveSimpleMaster(auth, "seminar_lib_target_groups", input),
  );
}

export async function duplicateTargetGroupAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withEdit((auth) =>
    duplicateSimpleMaster(auth, "seminar_lib_target_groups", id),
  );
}

export async function setTargetGroupActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await setSimpleMasterActive(auth.supabase, "seminar_lib_target_groups", id, isActive);
    return null;
  });
}

export async function setTargetGroupArchivedAction(
  id: string,
  isArchived: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await setSimpleMasterArchived(
      auth.supabase,
      "seminar_lib_target_groups",
      id,
      isArchived,
    );
    return null;
  });
}

export async function deleteTargetGroupAction(
  id: string,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await deleteSimpleMaster(auth.supabase, "seminar_lib_target_groups", id);
    return null;
  });
}

// ---------------------------------------------------------------------------
// Purposes
// ---------------------------------------------------------------------------

export async function listPurposesAction(options?: {
  includeArchived?: boolean;
}): Promise<ActionResult<SeminarLibSimpleMasterRow[]>> {
  return withView((auth) =>
    listSimpleMaster(auth.supabase, "seminar_lib_purposes", options),
  );
}

export async function savePurposeAction(input: {
  id?: string;
  values: SeminarLibSimpleMasterInput;
}): Promise<ActionResult<{ id: string }>> {
  return withEdit((auth) =>
    saveSimpleMaster(auth, "seminar_lib_purposes", input),
  );
}

export async function duplicatePurposeAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withEdit((auth) =>
    duplicateSimpleMaster(auth, "seminar_lib_purposes", id),
  );
}

export async function setPurposeActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await setSimpleMasterActive(auth.supabase, "seminar_lib_purposes", id, isActive);
    return null;
  });
}

export async function setPurposeArchivedAction(
  id: string,
  isArchived: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await setSimpleMasterArchived(
      auth.supabase,
      "seminar_lib_purposes",
      id,
      isArchived,
    );
    return null;
  });
}

export async function deletePurposeAction(
  id: string,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await deleteSimpleMaster(auth.supabase, "seminar_lib_purposes", id);
    return null;
  });
}

// ---------------------------------------------------------------------------
// Speakers
// ---------------------------------------------------------------------------

export async function listSpeakersAction(options?: {
  includeArchived?: boolean;
}): Promise<ActionResult<SeminarLibSpeakerRow[]>> {
  return withView(async (auth) => {
    let query = auth.supabase
      .from("seminar_lib_speakers")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!options?.includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapSpeaker);
  });
}

export async function saveSpeakerAction(input: {
  id?: string;
  values: SeminarLibSpeakerInput;
}): Promise<ActionResult<{ id: string }>> {
  return withEdit(async (auth) => {
    const name = input.values.name.trim();
    if (!name) throw new Error(t.nameRequired);

    const payload = {
      name,
      role_hint: input.values.role_hint?.trim() ?? "",
      sort_order: input.values.sort_order ?? 0,
      is_active: input.values.is_active ?? true,
    };
    const now = new Date().toISOString();

    if (input.id) {
      const { error } = await auth.supabase
        .from("seminar_lib_speakers")
        .update({ ...payload, updated_at: now })
        .eq("id", input.id);
      if (error) throw new Error(error.message);
      return { id: input.id };
    }

    const { data, error } = await auth.supabase
      .from("seminar_lib_speakers")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message ?? t.createFailed);
    return { id: data.id as string };
  });
}

export async function duplicateSpeakerAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withEdit(async (auth) => {
    const { data: row, error } = await auth.supabase
      .from("seminar_lib_speakers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !row) throw new Error(t.notFound);

    return saveSpeakerAction({
      values: {
        name: `${String(row.name)}${t.copySuffix}`,
        role_hint: String(row.role_hint ?? ""),
        sort_order: Number(row.sort_order ?? 0),
        is_active: Boolean(row.is_active ?? true),
      },
    }).then((result) => {
      if (!result.ok) throw new Error(result.error);
      return result.data;
    });
  });
}

export async function setSpeakerActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    const { error } = await auth.supabase
      .from("seminar_lib_speakers")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return null;
  });
}

export async function setSpeakerArchivedAction(
  id: string,
  isArchived: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    const { error } = await auth.supabase
      .from("seminar_lib_speakers")
      .update({
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return null;
  });
}

export async function deleteSpeakerAction(
  id: string,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    const { error } = await auth.supabase
      .from("seminar_lib_speakers")
      .delete()
      .eq("id", id);
    if (error) {
      if (error.code === "23503") throw new Error(t.inUseArchive);
      throw new Error(error.message);
    }
    return null;
  });
}

// ---------------------------------------------------------------------------
// Formats
// ---------------------------------------------------------------------------

export async function listFormatsAction(options?: {
  includeArchived?: boolean;
}): Promise<ActionResult<SeminarLibSimpleMasterRow[]>> {
  return withView((auth) =>
    listSimpleMaster(auth.supabase, "seminar_lib_formats", options),
  );
}

export async function saveFormatAction(input: {
  id?: string;
  values: SeminarLibSimpleMasterInput;
}): Promise<ActionResult<{ id: string }>> {
  return withEdit((auth) =>
    saveSimpleMaster(auth, "seminar_lib_formats", input),
  );
}

export async function duplicateFormatAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withEdit((auth) =>
    duplicateSimpleMaster(auth, "seminar_lib_formats", id),
  );
}

export async function setFormatActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await setSimpleMasterActive(auth.supabase, "seminar_lib_formats", id, isActive);
    return null;
  });
}

export async function setFormatArchivedAction(
  id: string,
  isArchived: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await setSimpleMasterArchived(
      auth.supabase,
      "seminar_lib_formats",
      id,
      isArchived,
    );
    return null;
  });
}

export async function deleteFormatAction(
  id: string,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await deleteSimpleMaster(auth.supabase, "seminar_lib_formats", id);
    return null;
  });
}

// ---------------------------------------------------------------------------
// Session statuses
// ---------------------------------------------------------------------------

export async function listSessionStatusesAction(options?: {
  includeArchived?: boolean;
}): Promise<ActionResult<SeminarLibSimpleMasterRow[]>> {
  return withView((auth) =>
    listSimpleMaster(auth.supabase, "seminar_lib_session_statuses", options),
  );
}

export async function saveSessionStatusAction(input: {
  id?: string;
  values: SeminarLibSimpleMasterInput;
}): Promise<ActionResult<{ id: string }>> {
  return withEdit((auth) =>
    saveSimpleMaster(auth, "seminar_lib_session_statuses", input),
  );
}

export async function duplicateSessionStatusAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withEdit((auth) =>
    duplicateSimpleMaster(auth, "seminar_lib_session_statuses", id),
  );
}

export async function setSessionStatusActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await setSimpleMasterActive(
      auth.supabase,
      "seminar_lib_session_statuses",
      id,
      isActive,
    );
    return null;
  });
}

export async function setSessionStatusArchivedAction(
  id: string,
  isArchived: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await setSimpleMasterArchived(
      auth.supabase,
      "seminar_lib_session_statuses",
      id,
      isArchived,
    );
    return null;
  });
}

export async function deleteSessionStatusAction(
  id: string,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    await deleteSimpleMaster(auth.supabase, "seminar_lib_session_statuses", id);
    return null;
  });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategoriesAction(options?: {
  includeArchived?: boolean;
}): Promise<ActionResult<SeminarLibCategoryRow[]>> {
  return withView(async (auth) => {
    let query = auth.supabase
      .from("seminar_lib_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!options?.includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapCategory);
  });
}

export async function saveCategoryAction(input: {
  id?: string;
  values: SeminarLibCategoryInput;
}): Promise<ActionResult<{ id: string }>> {
  return withEdit(async (auth) => {
    const name = input.values.name.trim();
    if (!name) throw new Error(t.nameRequired);

    const payload = {
      name,
      description: input.values.description?.trim() ?? "",
      color_hint: input.values.color_hint?.trim() ?? "",
      sort_order: input.values.sort_order ?? 0,
      is_active: input.values.is_active ?? true,
    };
    const now = new Date().toISOString();

    if (input.id) {
      const { error } = await auth.supabase
        .from("seminar_lib_categories")
        .update({ ...payload, updated_at: now })
        .eq("id", input.id);
      if (error) throw new Error(error.message);
      return { id: input.id };
    }

    const { data, error } = await auth.supabase
      .from("seminar_lib_categories")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message ?? t.createFailed);
    return { id: data.id as string };
  });
}

export async function duplicateCategoryAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withEdit(async (auth) => {
    const { data: row, error } = await auth.supabase
      .from("seminar_lib_categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !row) throw new Error(t.notFound);

    return saveCategoryAction({
      values: {
        name: `${String(row.name)}${t.copySuffix}`,
        description: String(row.description ?? ""),
        color_hint: String(row.color_hint ?? ""),
        sort_order: Number(row.sort_order ?? 0),
        is_active: Boolean(row.is_active ?? true),
      },
    }).then((result) => {
      if (!result.ok) throw new Error(result.error);
      return result.data;
    });
  });
}

export async function setCategoryActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    const { error } = await auth.supabase
      .from("seminar_lib_categories")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return null;
  });
}

export async function setCategoryArchivedAction(
  id: string,
  isArchived: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    const { error } = await auth.supabase
      .from("seminar_lib_categories")
      .update({
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return null;
  });
}

export async function deleteCategoryAction(
  id: string,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    const { error } = await auth.supabase
      .from("seminar_lib_categories")
      .delete()
      .eq("id", id);
    if (error) {
      if (error.code === "23503") throw new Error(t.inUseArchive);
      throw new Error(error.message);
    }
    return null;
  });
}

// ---------------------------------------------------------------------------
// Session library
// ---------------------------------------------------------------------------

function normalizeSessionInput(values: SeminarLibSessionInput) {
  const title = values.title.trim();
  if (!title) throw new Error(t.sessionTitleRequired);

  const minutes = values.recommended_minutes;
  if (minutes !== null && minutes !== undefined && minutes < 0) {
    throw new Error("recommended_minutes must be >= 0");
  }

  return {
    category_name: values.category_name?.trim() ?? "",
    title,
    recommended_format: values.recommended_format?.trim() ?? "",
    recommended_minutes: minutes ?? null,
    recommended_speaker: values.recommended_speaker?.trim() ?? "",
    detail_bullets: bulletsToJson(values.detail_bullets ?? []),
    objectives_bullets: bulletsToJson(values.objectives_bullets ?? []),
    outcomes_bullets: bulletsToJson(values.outcomes_bullets ?? []),
    target_group_names: values.target_group_names ?? [],
    sort_order: values.sort_order ?? 0,
    is_active: values.is_active ?? true,
  };
}

export async function listSessionLibraryAction(options?: {
  search?: string;
  categoryName?: string;
  includeArchived?: boolean;
  activeOnly?: boolean;
  sortBy?: SeminarSessionLibrarySortKey;
  sortAsc?: boolean;
}): Promise<ActionResult<SeminarLibSessionRow[]>> {
  return withView(async (auth) => {
    const sortBy = options?.sortBy ?? "sort_order";
    const sortAsc = options?.sortAsc ?? true;

    let query = auth.supabase.from("seminar_lib_sessions").select("*");

    if (!options?.includeArchived) {
      query = query.eq("is_archived", false);
    }
    if (options?.activeOnly) {
      query = query.eq("is_active", true);
    }
    if (options?.categoryName?.trim()) {
      query = query.eq("category_name", options.categoryName.trim());
    }
    if (options?.search?.trim()) {
      const term = `%${options.search.trim()}%`;
      query = query.or(
        `title.ilike.${term},category_name.ilike.${term},recommended_speaker.ilike.${term}`,
      );
    }

    query = query.order(sortBy, { ascending: sortAsc });
    if (sortBy !== "title") {
      query = query.order("title", { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapSession);
  });
}

export async function saveSessionLibraryAction(input: {
  id?: string;
  values: SeminarLibSessionInput;
}): Promise<ActionResult<{ id: string }>> {
  return withEdit(async (auth) => {
    const payload = normalizeSessionInput(input.values);
    const now = new Date().toISOString();

    if (input.id) {
      const { error } = await auth.supabase
        .from("seminar_lib_sessions")
        .update({ ...payload, updated_at: now })
        .eq("id", input.id);
      if (error) throw new Error(error.message);
      return { id: input.id };
    }

    const { data, error } = await auth.supabase
      .from("seminar_lib_sessions")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message ?? t.createFailed);
    return { id: data.id as string };
  });
}

export async function duplicateSessionLibraryAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withEdit(async (auth) => {
    const { data: row, error } = await auth.supabase
      .from("seminar_lib_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !row) throw new Error(t.sessionNotFound);
    const source = mapSession(row);

    return saveSessionLibraryAction({
      values: {
        category_name: source.category_name,
        title: `${source.title}${t.copySuffix}`,
        recommended_format: source.recommended_format,
        recommended_minutes: source.recommended_minutes,
        recommended_speaker: source.recommended_speaker,
        detail_bullets: duplicateBullets(source.detail_bullets),
        objectives_bullets: duplicateBullets(source.objectives_bullets),
        outcomes_bullets: duplicateBullets(source.outcomes_bullets),
        target_group_names: [...source.target_group_names],
        sort_order: source.sort_order,
        is_active: source.is_active,
      },
    }).then((result) => {
      if (!result.ok) throw new Error(result.error);
      return result.data;
    });
  });
}

export async function setSessionLibraryActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    const { error } = await auth.supabase
      .from("seminar_lib_sessions")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return null;
  });
}

export async function setSessionLibraryArchivedAction(
  id: string,
  isArchived: boolean,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    const { error } = await auth.supabase
      .from("seminar_lib_sessions")
      .update({
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return null;
  });
}

export async function deleteSessionLibraryAction(
  id: string,
): Promise<ActionResult<null>> {
  return withEdit(async (auth) => {
    const inUse = await isReferenced(auth.supabase, id, [
      { table: "seminar_agenda_items", column: "library_session_id" },
    ]);
    if (inUse) throw new Error(t.inUseArchive);

    const { error } = await auth.supabase
      .from("seminar_lib_sessions")
      .delete()
      .eq("id", id);
    if (error) {
      if (error.code === "23503") throw new Error(t.inUseArchive);
      throw new Error(error.message);
    }
    return null;
  });
}
