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
import { resolveEventAndAgendaDates } from "@/lib/seminar-planner-agenda-date";
import { getAuthenticatedSupabaseForActions } from "@/lib/supabase/authenticated-server";
import type { AppUser } from "@/types/auth";
import {
  SEMINAR_PLANNER_ERRORS as t,
  type SeminarAgendaItemInput,
  type SeminarAgendaItemRow,
  type SeminarEventBundle,
  type SeminarEventInput,
  type SeminarEventRow,
  type SeminarEventSummary,
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

function mapEvent(row: Record<string, unknown>): SeminarEventRow {
  return row as unknown as SeminarEventRow;
}

function mapAgendaItem(row: Record<string, unknown>): SeminarAgendaItemRow {
  const item = row as unknown as SeminarAgendaItemRow;
  return {
    ...item,
    detail_bullets: normalizeBullets(item.detail_bullets),
    objectives_bullets: normalizeBullets(item.objectives_bullets),
    outcomes_bullets: normalizeBullets(item.outcomes_bullets),
    target_group_names: item.target_group_names ?? [],
    duration_minutes:
      item.duration_minutes === null || item.duration_minutes === undefined
        ? null
        : Number(item.duration_minutes),
    agenda_short_detail: String(item.agenda_short_detail ?? ""),
  };
}

function normalizeEventInput(values: SeminarEventInput) {
  const title = values.title.trim();
  if (!title) throw new Error(t.eventTitleRequired);

  return {
    title,
    event_type: values.event_type?.trim() ?? "",
    start_date: values.start_date ?? null,
    end_date: values.end_date ?? null,
    daily_start_time: values.daily_start_time ?? null,
    daily_end_time: values.daily_end_time ?? null,
    venue: values.venue?.trim() ?? "",
    event_format: values.event_format ?? "on_site",
    estimated_attendees: values.estimated_attendees ?? null,
    owner: values.owner?.trim() ?? "",
    team_members: values.team_members?.trim() ?? "",
    status: values.status ?? "idea",
    notes: values.notes?.trim() ?? "",
    target_group_ids: values.target_group_ids ?? [],
    purpose_ids: values.purpose_ids ?? [],
  };
}

function normalizeAgendaInput(
  values: SeminarAgendaItemInput,
  eventDate: string | null,
) {
  const title = values.title.trim();
  if (!title) throw new Error(t.sessionTitleRequired);

  const minutes = values.duration_minutes;
  if (minutes !== null && minutes !== undefined && minutes < 0) {
    throw new Error("duration_minutes must be >= 0");
  }

  return {
    library_session_id: values.library_session_id ?? null,
    sort_order: values.sort_order,
    title,
    category_name: values.category_name?.trim() ?? "",
    format_name: values.format_name?.trim() ?? "",
    session_date: eventDate,
    start_time: values.start_time ?? null,
    end_time: values.end_time ?? null,
    duration_minutes: minutes ?? null,
    primary_speaker: values.primary_speaker?.trim() ?? "",
    co_speakers: values.co_speakers?.trim() ?? "",
    detail_bullets: bulletsToJson(values.detail_bullets ?? []),
    objectives_bullets: bulletsToJson(values.objectives_bullets ?? []),
    outcomes_bullets: bulletsToJson(values.outcomes_bullets ?? []),
    target_group_names: values.target_group_names ?? [],
    team_notes: values.team_notes?.trim() ?? "",
    agenda_short_detail: values.agenda_short_detail?.trim() ?? "",
    owner_name: values.owner_name?.trim() ?? "",
    status_name: values.status_name?.trim() ?? "",
    is_parallel: values.is_parallel ?? false,
  };
}

async function syncEventJunctions(
  supabase: SupabaseClient,
  eventId: string,
  targetGroupIds: string[],
  purposeIds: string[],
): Promise<void> {
  const { error: deleteTargetsError } = await supabase
    .from("seminar_event_target_groups")
    .delete()
    .eq("event_id", eventId);
  if (deleteTargetsError) throw new Error(deleteTargetsError.message);

  const { error: deletePurposesError } = await supabase
    .from("seminar_event_purposes")
    .delete()
    .eq("event_id", eventId);
  if (deletePurposesError) throw new Error(deletePurposesError.message);

  if (targetGroupIds.length > 0) {
    const { error } = await supabase.from("seminar_event_target_groups").insert(
      targetGroupIds.map((target_group_id) => ({
        event_id: eventId,
        target_group_id,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (purposeIds.length > 0) {
    const { error } = await supabase.from("seminar_event_purposes").insert(
      purposeIds.map((purpose_id) => ({
        event_id: eventId,
        purpose_id,
      })),
    );
    if (error) throw new Error(error.message);
  }
}

async function loadEventBundle(
  supabase: SupabaseClient,
  eventId: string,
): Promise<SeminarEventBundle | null> {
  const { data: event, error: eventError } = await supabase
    .from("seminar_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) return null;

  const { data: targetGroups } = await supabase
    .from("seminar_event_target_groups")
    .select("target_group_id")
    .eq("event_id", eventId);

  const { data: purposes } = await supabase
    .from("seminar_event_purposes")
    .select("purpose_id")
    .eq("event_id", eventId);

  const { data: agendaItems, error: agendaError } = await supabase
    .from("seminar_agenda_items")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (agendaError) throw new Error(agendaError.message);

  const mappedEvent = mapEvent(event);
  const mappedAgenda = (agendaItems ?? []).map(mapAgendaItem);
  const resolved = resolveEventAndAgendaDates(
    mappedEvent.start_date,
    mappedAgenda,
  );

  return {
    event: { ...mappedEvent, start_date: resolved.eventDate },
    target_group_ids: (targetGroups ?? []).map(
      (row) => row.target_group_id as string,
    ),
    purpose_ids: (purposes ?? []).map((row) => row.purpose_id as string),
    agenda_items: resolved.agendaItems,
  };
}

export async function listSeminarEventsAction(options?: {
  includeArchived?: boolean;
}): Promise<ActionResult<SeminarEventSummary[]>> {
  const auth = await requireView();
  if (!auth.ok) return auth;

  let query = auth.data.supabase
    .from("seminar_events")
    .select("*")
    .order("updated_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data: events, error } = await query;
  if (error) return fail(error.message);

  const summaries: SeminarEventSummary[] = [];
  for (const event of events ?? []) {
    const eventId = event.id as string;
    const { data: agendaItems } = await auth.data.supabase
      .from("seminar_agenda_items")
      .select("duration_minutes")
      .eq("event_id", eventId);

    const totalMinutes = (agendaItems ?? []).reduce((sum, item) => {
      const minutes = item.duration_minutes;
      return sum + (typeof minutes === "number" ? minutes : 0);
    }, 0);

    summaries.push({
      id: eventId,
      title: String(event.title),
      event_type: String(event.event_type ?? ""),
      start_date: (event.start_date as string | null) ?? null,
      end_date: (event.end_date as string | null) ?? null,
      event_format: event.event_format as SeminarEventSummary["event_format"],
      status: event.status as SeminarEventSummary["status"],
      owner: String(event.owner ?? ""),
      is_archived: Boolean(event.is_archived),
      session_count: agendaItems?.length ?? 0,
      total_minutes: totalMinutes,
      updated_at: String(event.updated_at),
    });
  }

  return { ok: true, data: summaries };
}

export async function getSeminarEventBundleAction(
  eventId: string,
): Promise<ActionResult<SeminarEventBundle>> {
  const auth = await requireView();
  if (!auth.ok) return auth;

  try {
    const bundle = await loadEventBundle(auth.data.supabase, eventId);
    if (!bundle) return fail(t.eventNotFound);
    return { ok: true, data: bundle };
  } catch (err) {
    return fail(err instanceof Error ? err.message : t.eventNotFound);
  }
}

export async function createSeminarEventAction(input: {
  values: SeminarEventInput;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  let values;
  try {
    values = normalizeEventInput(input.values);
  } catch (err) {
    return fail(err instanceof Error ? err.message : t.eventTitleRequired);
  }

  const { user, supabase } = auth.data;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("seminar_events")
    .insert({
      title: values.title,
      event_type: values.event_type,
      start_date: values.start_date,
      end_date: values.end_date,
      daily_start_time: values.daily_start_time,
      daily_end_time: values.daily_end_time,
      venue: values.venue,
      event_format: values.event_format,
      estimated_attendees: values.estimated_attendees,
      owner: values.owner,
      team_members: values.team_members,
      status: values.status,
      notes: values.notes,
      is_archived: false,
      created_by_email: user.email,
      updated_by_email: user.email,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !data) return fail(error?.message ?? t.eventCreateFailed);

  const eventId = data.id as string;
  try {
    await syncEventJunctions(
      supabase,
      eventId,
      values.target_group_ids,
      values.purpose_ids,
    );
  } catch (err) {
    return fail(err instanceof Error ? err.message : t.eventCreateFailed);
  }

  return { ok: true, data: { id: eventId } };
}

export async function saveSeminarEventAction(input: {
  id: string;
  values: SeminarEventInput;
}): Promise<ActionResult<{ id: string; updated_at: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  let values;
  try {
    values = normalizeEventInput(input.values);
  } catch (err) {
    return fail(err instanceof Error ? err.message : t.eventTitleRequired);
  }

  const { user, supabase } = auth.data;
  const now = new Date().toISOString();
  const eventId = input.id;

  const { data: existing } = await supabase
    .from("seminar_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  const payload = {
    title: values.title,
    event_type: values.event_type,
    start_date: values.start_date,
    end_date: values.end_date,
    daily_start_time: values.daily_start_time,
    daily_end_time: values.daily_end_time,
    venue: values.venue,
    event_format: values.event_format,
    estimated_attendees: values.estimated_attendees,
    owner: values.owner,
    team_members: values.team_members,
    status: values.status,
    notes: values.notes,
    updated_by_email: user.email,
    updated_at: now,
  };

  if (existing) {
    const { error } = await supabase
      .from("seminar_events")
      .update(payload)
      .eq("id", eventId);
    if (error) return fail(error.message);
  } else {
    const { error } = await supabase.from("seminar_events").insert({
      id: eventId,
      ...payload,
      is_archived: false,
      created_by_email: user.email,
    });
    if (error) return fail(error.message);
  }

  try {
    await syncEventJunctions(
      supabase,
      eventId,
      values.target_group_ids,
      values.purpose_ids,
    );
  } catch (err) {
    return fail(err instanceof Error ? err.message : t.eventCreateFailed);
  }

  if (values.start_date != null) {
    const { error: syncError } = await supabase
      .from("seminar_agenda_items")
      .update({ session_date: values.start_date })
      .eq("event_id", eventId);
    if (syncError) return fail(syncError.message);
  }

  return { ok: true, data: { id: eventId, updated_at: now } };
}

export async function duplicateSeminarEventAction(
  eventId: string,
  newTitle?: string,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { user, supabase } = auth.data;
  const bundle = await loadEventBundle(supabase, eventId);
  if (!bundle) return fail(t.eventNotFound);

  const now = new Date().toISOString();
  const title =
    newTitle?.trim() ||
    `${bundle.event.title}${t.copySuffix}`.slice(0, 500);

  const { data: newEvent, error: eventError } = await supabase
    .from("seminar_events")
    .insert({
      title,
      event_type: bundle.event.event_type,
      start_date: bundle.event.start_date,
      end_date: bundle.event.end_date,
      daily_start_time: bundle.event.daily_start_time,
      daily_end_time: bundle.event.daily_end_time,
      venue: bundle.event.venue,
      event_format: bundle.event.event_format,
      estimated_attendees: bundle.event.estimated_attendees,
      owner: bundle.event.owner,
      team_members: bundle.event.team_members,
      status: "idea",
      notes: bundle.event.notes,
      is_archived: false,
      created_by_email: user.email,
      updated_by_email: user.email,
      updated_at: now,
    })
    .select("id")
    .single();

  if (eventError || !newEvent) {
    return fail(eventError?.message ?? t.duplicateFailed);
  }

  const newEventId = newEvent.id as string;

  try {
    await syncEventJunctions(
      supabase,
      newEventId,
      bundle.target_group_ids,
      bundle.purpose_ids,
    );
  } catch (err) {
    return fail(err instanceof Error ? err.message : t.duplicateFailed);
  }

  for (const item of bundle.agenda_items) {
    const { error } = await supabase.from("seminar_agenda_items").insert({
      event_id: newEventId,
      library_session_id: item.library_session_id,
      sort_order: item.sort_order,
      title: item.title,
      category_name: item.category_name,
      format_name: item.format_name,
      session_date: item.session_date,
      start_time: item.start_time,
      end_time: item.end_time,
      duration_minutes: item.duration_minutes,
      primary_speaker: item.primary_speaker,
      co_speakers: item.co_speakers,
      detail_bullets: duplicateBullets(item.detail_bullets),
      objectives_bullets: duplicateBullets(item.objectives_bullets),
      outcomes_bullets: duplicateBullets(item.outcomes_bullets),
      target_group_names: [...item.target_group_names],
      team_notes: item.team_notes,
      agenda_short_detail: item.agenda_short_detail ?? "",
      owner_name: item.owner_name,
      status_name: item.status_name,
      is_parallel: item.is_parallel,
    });
    if (error) return fail(error.message);
  }

  return { ok: true, data: { id: newEventId } };
}

export async function setSeminarEventArchivedAction(
  eventId: string,
  isArchived: boolean,
): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { error } = await auth.data.supabase
    .from("seminar_events")
    .update({
      is_archived: isArchived,
      updated_by_email: auth.data.user.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) return fail(error.message);
  return { ok: true, data: null };
}

export async function deleteSeminarEventAction(
  eventId: string,
): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { supabase } = auth.data;

  const { data: event } = await supabase
    .from("seminar_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return fail(t.eventNotFound);

  const { error: agendaError } = await supabase
    .from("seminar_agenda_items")
    .delete()
    .eq("event_id", eventId);
  if (agendaError) return fail(agendaError.message);

  const { error: targetError } = await supabase
    .from("seminar_event_target_groups")
    .delete()
    .eq("event_id", eventId);
  if (targetError) return fail(targetError.message);

  const { error: purposeError } = await supabase
    .from("seminar_event_purposes")
    .delete()
    .eq("event_id", eventId);
  if (purposeError) return fail(purposeError.message);

  const { error: eventError } = await supabase
    .from("seminar_events")
    .delete()
    .eq("id", eventId);
  if (eventError) return fail(eventError.message);

  return { ok: true, data: null };
}

export async function saveSeminarAgendaItemsAction(input: {
  event_id: string;
  items: SeminarAgendaItemInput[];
}): Promise<ActionResult<{ updated_at: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { supabase } = auth.data;
  const eventId = input.event_id;
  const now = new Date().toISOString();

  const { data: event } = await supabase
    .from("seminar_events")
    .select("id, start_date")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return fail(t.eventNotFound);

  const eventDate = (event.start_date as string | null) ?? null;

  const { data: existingItems } = await supabase
    .from("seminar_agenda_items")
    .select("id")
    .eq("event_id", eventId);

  const incomingIds = new Set(
    input.items.flatMap((item) => (item.id ? [item.id] : [])),
  );
  const toDelete = (existingItems ?? [])
    .map((row) => row.id as string)
    .filter((id) => !incomingIds.has(id));

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("seminar_agenda_items")
      .delete()
      .in("id", toDelete);
    if (error) return fail(error.message);
  }

  for (const item of input.items) {
    let payload;
    try {
      payload = normalizeAgendaInput(item, eventDate);
    } catch (err) {
      return fail(err instanceof Error ? err.message : t.sessionTitleRequired);
    }

    if (item.id) {
      const { error } = await supabase
        .from("seminar_agenda_items")
        .update({ ...payload, updated_at: now })
        .eq("id", item.id)
        .eq("event_id", eventId);
      if (error) return fail(error.message);
      continue;
    }

    const { error } = await supabase.from("seminar_agenda_items").insert({
      event_id: eventId,
      ...payload,
    });
    if (error) return fail(error.message);
  }

  const { error: touchError } = await supabase
    .from("seminar_events")
    .update({
      updated_by_email: auth.data.user.email,
      updated_at: now,
    })
    .eq("id", eventId);
  if (touchError) return fail(touchError.message);

  return { ok: true, data: { updated_at: now } };
}

export async function addLibrarySessionToAgendaAction(input: {
  event_id: string;
  library_session_id: string;
  sort_order?: number;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { supabase } = auth.data;
  const eventId = input.event_id;

  const { data: event } = await supabase
    .from("seminar_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return fail(t.eventNotFound);

  const { data: session, error: sessionError } = await supabase
    .from("seminar_lib_sessions")
    .select("*")
    .eq("id", input.library_session_id)
    .maybeSingle();

  if (sessionError || !session) return fail(t.sessionNotFound);

  let sortOrder = input.sort_order;
  if (sortOrder === undefined) {
    const { data: lastItem } = await supabase
      .from("seminar_agenda_items")
      .select("sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = lastItem ? Number(lastItem.sort_order) + 1 : 0;
  }

  const now = new Date().toISOString();
  const { data: inserted, error } = await supabase
    .from("seminar_agenda_items")
    .insert({
      event_id: eventId,
      library_session_id: input.library_session_id,
      sort_order: sortOrder,
      title: String(session.title),
      category_name: String(session.category_name ?? ""),
      format_name: String(session.recommended_format ?? ""),
      duration_minutes:
        session.recommended_minutes === null ||
        session.recommended_minutes === undefined
          ? null
          : Number(session.recommended_minutes),
      primary_speaker: String(session.recommended_speaker ?? ""),
      co_speakers: "",
      detail_bullets: normalizeBullets(session.detail_bullets),
      objectives_bullets: normalizeBullets(session.objectives_bullets),
      outcomes_bullets: normalizeBullets(session.outcomes_bullets),
      target_group_names: (session.target_group_names as string[] | null) ?? [],
      team_notes: "",
      owner_name: "",
      status_name: "",
      is_parallel: false,
    })
    .select("id")
    .single();

  if (error || !inserted) return fail(error?.message ?? t.createFailed);

  const { error: touchError } = await supabase
    .from("seminar_events")
    .update({
      updated_by_email: auth.data.user.email,
      updated_at: now,
    })
    .eq("id", eventId);
  if (touchError) return fail(touchError.message);

  return { ok: true, data: { id: inserted.id as string } };
}

export async function deleteSeminarAgendaItemAction(input: {
  event_id: string;
  agenda_item_id: string;
}): Promise<ActionResult<null>> {
  const auth = await requireEdit();
  if (!auth.ok) return auth;

  const { data: existing } = await auth.data.supabase
    .from("seminar_agenda_items")
    .select("id")
    .eq("id", input.agenda_item_id)
    .eq("event_id", input.event_id)
    .maybeSingle();

  if (!existing) return fail(t.agendaItemNotFound);

  const { error } = await auth.data.supabase
    .from("seminar_agenda_items")
    .delete()
    .eq("id", input.agenda_item_id)
    .eq("event_id", input.event_id);

  if (error) return fail(error.message);

  const now = new Date().toISOString();
  const { error: touchError } = await auth.data.supabase
    .from("seminar_events")
    .update({
      updated_by_email: auth.data.user.email,
      updated_at: now,
    })
    .eq("id", input.event_id);
  if (touchError) return fail(touchError.message);

  return { ok: true, data: null };
}
