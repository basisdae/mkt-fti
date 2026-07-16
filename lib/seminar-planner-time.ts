import type { SeminarAgendaItemInput, SeminarAgendaItemRow } from "@/types/seminar-planner";

export type AgendaTimeItem = Pick<
  SeminarAgendaItemRow | SeminarAgendaItemInput,
  "id" | "title" | "session_date" | "start_time" | "end_time" | "duration_minutes" | "is_parallel"
> & { id?: string };

export interface TimeOverlapWarning {
  itemAId: string;
  itemBId: string;
  itemATitle: string;
  itemBTitle: string;
  sessionDate: string;
}

const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/** Parse HH:mm or HH:mm:ss to minutes from midnight. Returns null if invalid. */
export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = TIME_RE.exec(trimmed);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/** Format minutes from midnight to HH:mm. */
export function formatMinutesToTime(totalMinutes: number | null): string | null {
  if (totalMinutes == null || !Number.isFinite(totalMinutes)) return null;
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMinutes)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Normalize DB time (may include seconds) to HH:mm for inputs. */
export function normalizeTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  const minutes = parseTimeToMinutes(value);
  return minutes == null ? value.slice(0, 5) : (formatMinutesToTime(minutes) ?? "");
}

/** Duration from start/end; falls back to duration_minutes when times missing. */
export function calcDurationMinutes(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  durationMinutes?: number | null,
): number | null {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start != null && end != null) {
    if (end < start) return null;
    return end - start;
  }
  if (durationMinutes != null && Number.isFinite(durationMinutes) && durationMinutes >= 0) {
    return durationMinutes;
  }
  return null;
}

function itemTimeRange(item: AgendaTimeItem): {
  date: string;
  start: number;
  end: number;
} | null {
  if (!item.session_date) return null;
  const start = parseTimeToMinutes(item.start_time);
  const end = parseTimeToMinutes(item.end_time);
  if (start == null || end == null || end <= start) return null;
  return { date: item.session_date, start, end };
}

function rangesOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Detect overlapping sessions on the same date (ignores items without complete times). */
export function detectAgendaOverlaps(items: AgendaTimeItem[]): TimeOverlapWarning[] {
  const warnings: TimeOverlapWarning[] = [];
  const withRanges = items
    .map((item) => ({ item, range: itemTimeRange(item) }))
    .filter((entry): entry is { item: AgendaTimeItem; range: NonNullable<ReturnType<typeof itemTimeRange>> } =>
      entry.range != null,
    );

  for (let i = 0; i < withRanges.length; i++) {
    for (let j = i + 1; j < withRanges.length; j++) {
      const a = withRanges[i];
      const b = withRanges[j];
      if (a.range.date !== b.range.date) continue;
      if (!rangesOverlap(a.range, b.range)) continue;

      const idA = a.item.id ?? `idx-${i}`;
      const idB = b.item.id ?? `idx-${j}`;
      warnings.push({
        itemAId: idA,
        itemBId: idB,
        itemATitle: a.item.title || `เซสชัน ${i + 1}`,
        itemBTitle: b.item.title || `เซสชัน ${j + 1}`,
        sessionDate: a.range.date,
      });
    }
  }

  return warnings;
}

export interface AgendaTimeSummary {
  totalMinutes: number;
  earliestStart: string | null;
  latestEnd: string | null;
  sessionCount: number;
}

export function summarizeAgendaTimes(items: AgendaTimeItem[]): AgendaTimeSummary {
  let totalMinutes = 0;
  let earliest: number | null = null;
  let latest: number | null = null;
  let sessionCount = 0;

  for (const item of items) {
    const duration = calcDurationMinutes(
      item.start_time,
      item.end_time,
      item.duration_minutes,
    );
    if (duration != null) {
      totalMinutes += duration;
      sessionCount += 1;
    }

    const start = parseTimeToMinutes(item.start_time);
    const end = parseTimeToMinutes(item.end_time);
    if (start != null) {
      earliest = earliest == null ? start : Math.min(earliest, start);
    }
    if (end != null) {
      latest = latest == null ? end : Math.max(latest, end);
    }
  }

  return {
    totalMinutes,
    earliestStart: formatMinutesToTime(earliest),
    latestEnd: formatMinutesToTime(latest),
    sessionCount: items.length,
  };
}
