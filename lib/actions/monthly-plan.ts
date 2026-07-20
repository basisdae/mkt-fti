"use server";

import {
  canEditMonthlyPlan,
  canViewMonthlyPlan,
} from "@/lib/auth/permissions";
import { getAuthenticatedSupabaseForActions } from "@/lib/supabase/authenticated-server";
import { listAppUsersFromSupabase } from "@/lib/services/app-users";
import { calcWorkProgress } from "@/lib/monthly-plan-progress";
import type {
  MktWorkAssigneeOption,
  MktWorkBoardFilters,
  MktWorkItemCard,
  MktWorkItemInput,
  MktWorkItemRow,
  MktWorkPlacementUpdate,
  MktWorkSubtaskInput,
  MktWorkSubtaskRow,
} from "@/types/monthly-plan";
import { MONTHLY_PLAN_ERRORS as t } from "@/types/monthly-plan";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppUser } from "@/types/auth";

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
  if (!canViewMonthlyPlan(user) && !canEditMonthlyPlan(user)) {
    return fail(t.noPermissionView);
  }

  return { ok: true, data: { user, supabase } };
}

async function requireEdit(): Promise<ActionResult<ActionAuth>> {
  const view = await requireView();
  if (!view.ok) return view;
  if (!canEditMonthlyPlan(view.data.user)) {
    return fail(t.noPermissionEdit);
  }
  return view;
}

function mapWorkItem(row: Record<string, unknown>): MktWorkItemRow {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    status: row.status as MktWorkItemRow["status"],
    priority: (row.priority as MktWorkItemRow["priority"]) ?? null,
    plan_year: row.plan_year == null ? null : Number(row.plan_year),
    plan_month: row.plan_month == null ? null : Number(row.plan_month),
    sort_order: Number(row.sort_order ?? 0),
    owner_user_id: row.owner_user_id ? String(row.owner_user_id) : null,
    collaborator_user_ids: Array.isArray(row.collaborator_user_ids)
      ? row.collaborator_user_ids.map(String)
      : [],
    start_date: row.start_date ? String(row.start_date) : null,
    deadline: row.deadline ? String(row.deadline) : null,
    created_by_email: String(row.created_by_email ?? ""),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function mapSubtask(row: Record<string, unknown>): MktWorkSubtaskRow {
  return {
    id: String(row.id),
    work_item_id: String(row.work_item_id),
    title: String(row.title ?? ""),
    is_done: Boolean(row.is_done),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function toCard(
  item: MktWorkItemRow,
  subtasks: MktWorkSubtaskRow[],
): MktWorkItemCard {
  const progress = calcWorkProgress(subtasks);
  return {
    ...item,
    subtasks,
    subtasks_done: progress.done,
    subtasks_total: progress.total,
  };
}

function normalizeWorkInput(values: MktWorkItemInput) {
  const title = values.title.trim();
  if (!title) throw new Error(t.titleRequired);

  return {
    title,
    description: values.description?.trim() ?? "",
    status: values.status ?? "PLAN",
    priority: values.priority ?? null,
    plan_year: values.plan_year ?? null,
    plan_month: values.plan_month ?? null,
    sort_order: values.sort_order ?? 0,
    owner_user_id: values.owner_user_id ?? null,
    collaborator_user_ids: values.collaborator_user_ids ?? [],
    start_date: values.start_date ?? null,
    deadline: values.deadline ?? null,
  };
}

function matchesFilters(
  item: MktWorkItemCard,
  filters: MktWorkBoardFilters,
): boolean {
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    if (!item.title.toLowerCase().includes(q)) return false;
  }
  if (filters.status && filters.status !== "all" && item.status !== filters.status) {
    return false;
  }
  if (
    filters.priority &&
    filters.priority !== "all" &&
    item.priority !== filters.priority
  ) {
    return false;
  }
  if (
    filters.ownerUserId &&
    filters.ownerUserId !== "all" &&
    item.owner_user_id !== filters.ownerUserId
  ) {
    return false;
  }
  if (filters.month && filters.month !== "all") {
    if (filters.month === "unplanned") {
      if (item.plan_month != null) return false;
    } else if (item.plan_month !== filters.month) {
      return false;
    }
  }
  return true;
}

async function fetchSubtasksForItems(
  supabase: SupabaseClient,
  itemIds: string[],
): Promise<Map<string, MktWorkSubtaskRow[]>> {
  const map = new Map<string, MktWorkSubtaskRow[]>();
  if (itemIds.length === 0) return map;

  const { data, error } = await supabase
    .from("mkt_work_subtasks")
    .select("*")
    .in("work_item_id", itemIds)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const subtask = mapSubtask(row as Record<string, unknown>);
    const list = map.get(subtask.work_item_id) ?? [];
    list.push(subtask);
    map.set(subtask.work_item_id, list);
  }
  return map;
}

export async function listMonthlyPlanBoardAction(
  year: number,
  filters: MktWorkBoardFilters = {},
): Promise<ActionResult<MktWorkItemCard[]>> {
  const auth = await requireView();
  if (!auth.ok) return auth;

  const { supabase } = auth.data;

  const { data, error } = await supabase
    .from("mkt_work_items")
    .select("*")
    .or(
      `and(plan_year.eq.${year},plan_month.not.is.null),and(plan_year.is.null,plan_month.is.null)`,
    )
    .order("sort_order", { ascending: true });

  if (error) return fail(error.message);

  const rows = (data ?? []).map((row) =>
    mapWorkItem(row as Record<string, unknown>),
  );
  const subtaskMap = await fetchSubtasksForItems(
    supabase,
    rows.map((row) => row.id),
  );

  const cards = rows
    .map((row) => toCard(row, subtaskMap.get(row.id) ?? []))
    .filter((item) => matchesFilters(item, filters));

  return { ok: true, data: cards };
}

export async function getMonthlyWorkItemAction(
  id: string,
): Promise<ActionResult<MktWorkItemCard>> {
  const auth = await requireView();
  if (!auth.ok) return auth;

  const { supabase } = auth.data;
  const { data, error } = await supabase
    .from("mkt_work_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return fail(t.workNotFound);

  const item = mapWorkItem(data as Record<string, unknown>);
  const subtaskMap = await fetchSubtasksForItems(supabase, [item.id]);
  return {
    ok: true,
    data: toCard(item, subtaskMap.get(item.id) ?? []),
  };
}

export async function createMonthlyWorkItemAction(
  values: MktWorkItemInput,
): Promise<ActionResult<MktWorkItemCard>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  try {
    const payload = normalizeWorkInput(values);
    const { supabase, user } = auth.data;

    const { data, error } = await supabase
      .from("mkt_work_items")
      .insert({
        ...payload,
        created_by_email: user.email,
      })
      .select("*")
      .single();

    if (error) return fail(error.message);
    const item = mapWorkItem(data as Record<string, unknown>);
    return { ok: true, data: toCard(item, []) };
  } catch (err) {
    return fail(err instanceof Error ? err.message : t.saveFailed);
  }
}

export async function updateMonthlyWorkItemAction(
  id: string,
  values: Partial<MktWorkItemInput>,
): Promise<ActionResult<MktWorkItemCard>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { supabase } = auth.data;
  const existing = await getMonthlyWorkItemAction(id);
  if (!existing.ok) return existing;

  try {
    const merged = normalizeWorkInput({
      ...existing.data,
      ...values,
      title: values.title ?? existing.data.title,
    });

    const { data, error } = await supabase
      .from("mkt_work_items")
      .update(merged)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return fail(error.message);
    const item = mapWorkItem(data as Record<string, unknown>);
    const subtaskMap = await fetchSubtasksForItems(supabase, [id]);
    return {
      ok: true,
      data: toCard(item, subtaskMap.get(id) ?? []),
    };
  } catch (err) {
    return fail(err instanceof Error ? err.message : t.saveFailed);
  }
}

export async function deleteMonthlyWorkItemAction(
  id: string,
): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { error } = await auth.data.supabase
    .from("mkt_work_items")
    .delete()
    .eq("id", id);

  if (error) return fail(error.message);
  return { ok: true, data: null };
}

export async function saveMonthlyWorkSubtasksAction(
  workItemId: string,
  subtasks: MktWorkSubtaskInput[],
): Promise<ActionResult<MktWorkSubtaskRow[]>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { supabase } = auth.data;
  const existing = await getMonthlyWorkItemAction(workItemId);
  if (!existing.ok) return existing;

  const normalized = subtasks
    .map((task, index) => ({
      id: task.id,
      title: task.title.trim(),
      is_done: Boolean(task.is_done),
      sort_order: index,
    }))
    .filter((task) => task.title.length > 0);

  const keepIds = normalized
    .map((task) => task.id)
    .filter((id): id is string => Boolean(id));

  const { data: existingRows, error: listError } = await supabase
    .from("mkt_work_subtasks")
    .select("id")
    .eq("work_item_id", workItemId);
  if (listError) return fail(listError.message);

  const deleteIds = (existingRows ?? [])
    .map((row) => String(row.id))
    .filter((id) => !keepIds.includes(id));

  if (deleteIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("mkt_work_subtasks")
      .delete()
      .in("id", deleteIds);
    if (deleteError) return fail(deleteError.message);
  }

  const saved: MktWorkSubtaskRow[] = [];

  for (const task of normalized) {
    if (task.id) {
      const { data, error } = await supabase
        .from("mkt_work_subtasks")
        .update({
          title: task.title,
          is_done: task.is_done,
          sort_order: task.sort_order,
        })
        .eq("id", task.id)
        .eq("work_item_id", workItemId)
        .select("*")
        .single();
      if (error) return fail(error.message);
      saved.push(mapSubtask(data as Record<string, unknown>));
    } else {
      const { data, error } = await supabase
        .from("mkt_work_subtasks")
        .insert({
          work_item_id: workItemId,
          title: task.title,
          is_done: task.is_done,
          sort_order: task.sort_order,
        })
        .select("*")
        .single();
      if (error) return fail(error.message);
      saved.push(mapSubtask(data as Record<string, unknown>));
    }
  }

  return { ok: true, data: saved };
}

export async function batchUpdateMonthlyPlacementsAction(
  updates: MktWorkPlacementUpdate[],
): Promise<ActionResult<MktWorkItemRow[]>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  if (updates.length === 0) {
    return { ok: true, data: [] };
  }

  const { supabase } = auth.data;
  const saved: MktWorkItemRow[] = [];

  for (const update of updates) {
    const { data, error } = await supabase
      .from("mkt_work_items")
      .update({
        plan_year: update.plan_year,
        plan_month: update.plan_month,
        sort_order: update.sort_order,
      })
      .eq("id", update.id)
      .select("*")
      .single();

    if (error) return fail(error.message);
    saved.push(mapWorkItem(data as Record<string, unknown>));
  }

  return { ok: true, data: saved };
}

export async function listMonthlyPlanAssigneesAction(): Promise<
  ActionResult<MktWorkAssigneeOption[]>
> {
  const auth = await requireView();
  if (!auth.ok) return auth;

  try {
    const users = await listAppUsersFromSupabase();
    const options = users
      .filter((user) => user.isActive)
      .map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.email,
      }));
    return { ok: true, data: options };
  } catch (err) {
    return fail(err instanceof Error ? err.message : t.saveFailed);
  }
}
