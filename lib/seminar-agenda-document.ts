import { formatSeminarCategoryLabel } from "@/lib/seminar-planner-category-labels";
import { agendaItemKey } from "@/lib/seminar-planner-agenda-keys";
import {
  resolveSeminarCategoryVisual,
  type SeminarCategoryVisual,
} from "@/lib/seminar-agenda-category-colors";
import { SEMINAR_EVENT_FORMAT_LABELS } from "@/lib/seminar-planner-format";
import { calcDurationMinutes } from "@/lib/seminar-planner-time";
import type {
  SeminarAgendaItemInput,
  SeminarEventFormat,
  SeminarEventRow,
} from "@/types/seminar-planner";

export interface SeminarAgendaDocumentSession {
  id: string;
  order: number;
  title: string | null;
  categoryName: string | null;
  categoryVisual: SeminarCategoryVisual;
  shortDetail: string | null;
}

export interface SeminarAgendaDocumentModel {
  projectTitle: string;
  dateLabel: string;
  venueLabel: string;
  formatLabel: string;
  topicCountLabel: string;
  isDraft: boolean;
  sessions: SeminarAgendaDocumentSession[];
}

export interface BuildSeminarAgendaDocumentOptions {
  event: Pick<
    SeminarEventRow,
    "title" | "start_date" | "end_date" | "venue" | "event_format"
  >;
  items: SeminarAgendaItemInput[];
  categoryColorHints?: Record<string, string>;
}

function formatDocumentDateLabel(
  start: string | null,
  end: string | null,
): string {
  if (!start && !end) return "—";
  const formatOne = (value: string) => {
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  if (start && end && start !== end) {
    return `${formatOne(start)} – ${formatOne(end)}`;
  }
  return formatOne(start ?? end ?? "");
}

function formatDocumentTopicCount(sessionCount: number): string {
  if (sessionCount <= 0) return "—";
  return `${sessionCount.toLocaleString("th-TH")} หัวข้อ`;
}

/** Participant-facing completeness — excludes owner and internal workflow fields. */
export function isAgendaItemIncompleteForExport(
  item: SeminarAgendaItemInput,
): boolean {
  if (!item.title?.trim()) return true;
  const hasStart = Boolean(item.start_time?.trim());
  const hasEnd = Boolean(item.end_time?.trim());
  if (!hasStart || !hasEnd) return true;

  const duration = calcDurationMinutes(
    item.start_time,
    item.end_time,
    item.duration_minutes,
  );
  if (duration == null || duration <= 0) return true;

  return false;
}

export function isAgendaDocumentDraft(items: SeminarAgendaItemInput[]): boolean {
  if (items.length === 0) return true;
  return items.some(isAgendaItemIncompleteForExport);
}

export function buildSeminarAgendaDocument(
  options: BuildSeminarAgendaDocumentOptions,
): SeminarAgendaDocumentModel {
  const { event, items, categoryColorHints = {} } = options;
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  const sessions: SeminarAgendaDocumentSession[] = sorted.map((item, index) => {
    const categoryKey = item.category_name?.trim() || "";
    const colorHint = categoryColorHints[categoryKey];

    return {
      id: agendaItemKey(item, index),
      order: index + 1,
      title: item.title?.trim() || null,
      categoryName: formatSeminarCategoryLabel(categoryKey),
      categoryVisual: resolveSeminarCategoryVisual(
        categoryKey,
        item.format_name,
        colorHint,
      ),
      shortDetail: item.agenda_short_detail?.trim() || null,
    };
  });

  const formatLabel =
    SEMINAR_EVENT_FORMAT_LABELS[event.event_format as SeminarEventFormat] ??
    event.event_format;

  return {
    projectTitle: event.title?.trim() || "—",
    dateLabel: formatDocumentDateLabel(event.start_date, event.end_date),
    venueLabel: event.venue?.trim() || "—",
    formatLabel,
    topicCountLabel: formatDocumentTopicCount(sorted.length),
    isDraft: isAgendaDocumentDraft(sorted),
    sessions,
  };
}

export function seminarAgendaDocumentPrintTitle(
  model: SeminarAgendaDocumentModel,
): string {
  return `${model.projectTitle} — Agenda`;
}
