import type { SeminarAgendaItemRow } from "@/types/seminar-planner";

type DatedAgendaItem = Pick<SeminarAgendaItemRow, "session_date">;

/** Pick the most common session_date from legacy per-session data. */
export function inferAgendaEventDate(
  items: DatedAgendaItem[],
): string | null {
  const dates = items
    .map((item) => item.session_date)
    .filter((value): value is string => Boolean(value?.trim()));

  if (dates.length === 0) return null;

  const counts = new Map<string, number>();
  for (const date of dates) {
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  let best = dates[0];
  let bestCount = 0;
  for (const [date, count] of counts) {
    if (count > bestCount) {
      best = date;
      bestCount = count;
    }
  }
  return best;
}

export function syncAgendaItemsToEventDate<T extends { session_date?: string | null }>(
  items: T[],
  eventDate: string | null,
): T[] {
  return items.map((item) => ({ ...item, session_date: eventDate }));
}

export function resolveEventAndAgendaDates<
  T extends SeminarAgendaItemRow,
>(eventStartDate: string | null, agendaItems: T[]): {
  eventDate: string | null;
  agendaItems: T[];
} {
  const eventDate = eventStartDate ?? inferAgendaEventDate(agendaItems);
  return {
    eventDate,
    agendaItems: syncAgendaItemsToEventDate(agendaItems, eventDate),
  };
}
