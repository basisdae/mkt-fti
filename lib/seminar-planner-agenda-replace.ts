import { duplicateBullets, normalizeBullets } from "@/lib/seminar-planner-bullets";
import {
  formatMinutesToTime,
  parseTimeToMinutes,
} from "@/lib/seminar-planner-time";
import type {
  SeminarAgendaItemInput,
  SeminarLibSessionRow,
} from "@/types/seminar-planner";

/** Agenda-only fields preserved when swapping library session. */
const PRESERVED_KEYS = new Set([
  "id",
  "client_key",
  "sort_order",
  "start_time",
  "status_name",
  "owner_name",
  "team_notes",
  "agenda_short_detail",
  "is_parallel",
]);

export function needsLibraryReplaceConfirm(
  item: SeminarAgendaItemInput,
  session: SeminarLibSessionRow,
): boolean {
  if (item.library_session_id === session.id) return false;

  const hasBullets =
    normalizeBullets(item.detail_bullets).length > 0 ||
    normalizeBullets(item.objectives_bullets).length > 0 ||
    normalizeBullets(item.outcomes_bullets).length > 0;
  if (hasBullets) return true;

  if (
    item.primary_speaker?.trim() &&
    item.primary_speaker.trim() !== session.recommended_speaker.trim()
  ) {
    return true;
  }

  if (
    item.title?.trim() &&
    item.library_session_id &&
    item.title.trim() !== session.title.trim()
  ) {
    return true;
  }

  return false;
}

export function applyLibrarySessionToAgendaItem(
  item: SeminarAgendaItemInput,
  session: SeminarLibSessionRow,
  eventDate: string | null,
): SeminarAgendaItemInput {
  const preserved = Object.fromEntries(
    Object.entries(item).filter(([key]) => PRESERVED_KEYS.has(key)),
  ) as Partial<SeminarAgendaItemInput>;

  return {
    ...item,
    ...preserved,
    library_session_id: session.id,
    title: session.title,
    category_name: session.category_name,
    format_name: session.recommended_format,
    duration_minutes: session.recommended_minutes,
    primary_speaker: session.recommended_speaker,
    co_speakers: "",
    detail_bullets: duplicateBullets(normalizeBullets(session.detail_bullets)),
    objectives_bullets: duplicateBullets(
      normalizeBullets(session.objectives_bullets),
    ),
    outcomes_bullets: duplicateBullets(
      normalizeBullets(session.outcomes_bullets),
    ),
    target_group_names: [...session.target_group_names],
    session_date: eventDate,
  };
}

export function recalcAgendaItemEndTime(
  item: SeminarAgendaItemInput,
): SeminarAgendaItemInput {
  const start = parseTimeToMinutes(item.start_time);
  const duration = item.duration_minutes;
  if (start == null || duration == null || duration < 0) {
    return item;
  }
  return {
    ...item,
    end_time: formatMinutesToTime(start + duration),
    duration_minutes: duration,
  };
}

/** Shift following sessions on the same date when duration changes. */
export function cascadeAgendaTimesFromIndex(
  items: SeminarAgendaItemInput[],
  fromIndex: number,
): SeminarAgendaItemInput[] {
  if (fromIndex < 0 || fromIndex >= items.length) return items;

  const next = items.map((item) => ({ ...item }));

  for (let index = fromIndex; index < next.length; index += 1) {
    if (index > fromIndex) {
      const previous = next[index - 1];
      const current = next[index];
      if (previous.is_parallel || current.is_parallel) {
        next[index] = recalcAgendaItemEndTime(current);
        continue;
      }
      if (
        previous.session_date &&
        current.session_date === previous.session_date &&
        previous.end_time
      ) {
        next[index] = recalcAgendaItemEndTime({
          ...current,
          start_time: previous.end_time,
        });
        continue;
      }
    }
    next[index] = recalcAgendaItemEndTime(next[index]);
  }

  return next;
}

export function replaceAgendaItemFromLibrary(
  items: SeminarAgendaItemInput[],
  index: number,
  session: SeminarLibSessionRow,
  eventDate: string | null,
): SeminarAgendaItemInput[] {
  if (index < 0 || index >= items.length) return items;

  const next = items.map((item) => ({ ...item }));
  next[index] = applyLibrarySessionToAgendaItem(
    next[index],
    session,
    eventDate,
  );
  return cascadeAgendaTimesFromIndex(next, index);
}
