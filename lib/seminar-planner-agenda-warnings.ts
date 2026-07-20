import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import { agendaItemKey } from "@/lib/seminar-planner-agenda-keys";
import {
  calcDurationMinutes,
  detectAgendaOverlaps,
  type AgendaTimeItem,
} from "@/lib/seminar-planner-time";
import type { SeminarAgendaItemInput } from "@/types/seminar-planner";

export interface SeminarAgendaWarning {
  id: string;
  message: string;
  severity: "info" | "warning" | "error";
  itemId?: string;
  relatedItemIds?: string[];
}

export type AgendaWarningCategory =
  | "missing_owner"
  | "incomplete_data"
  | "time_overlap"
  | "invalid_duration";

export interface AgendaWarningIssue {
  warningId: string;
  category: AgendaWarningCategory;
  message: string;
  severity: "warning" | "error";
  itemId: string;
  itemIndex: number;
  sessionLabel: string;
}

export interface AgendaWarningReport {
  totalIssueCount: number;
  affectedSessionCount: number;
  issues: AgendaWarningIssue[];
  groupedIssues: Record<AgendaWarningCategory, AgendaWarningIssue[]>;
}

const WARNING_CATEGORY_ORDER: AgendaWarningCategory[] = [
  "missing_owner",
  "incomplete_data",
  "time_overlap",
  "invalid_duration",
];

export function agendaWarningCategoryLabel(
  category: AgendaWarningCategory,
): string {
  switch (category) {
    case "missing_owner":
      return t.warningCategoryMissingOwner;
    case "incomplete_data":
      return t.warningCategoryIncomplete;
    case "time_overlap":
      return t.warningCategoryOverlap;
    case "invalid_duration":
      return t.warningCategoryInvalidDuration;
    default:
      return category;
  }
}

export { WARNING_CATEGORY_ORDER as AGENDA_WARNING_CATEGORY_ORDER };

export function agendaWarningCategory(
  warning: SeminarAgendaWarning,
): AgendaWarningCategory | null {
  if (
    warning.id === "unsaved" ||
    warning.id === "no-sessions" ||
    warning.id === "parallel-overlap-count"
  ) {
    return null;
  }
  if (warning.id.startsWith("missing-owner")) return "missing_owner";
  if (
    warning.id.startsWith("missing-title") ||
    warning.id.startsWith("missing-time") ||
    warning.id.startsWith("missing-speaker")
  ) {
    return "incomplete_data";
  }
  if (warning.id.startsWith("invalid-duration")) return "invalid_duration";
  if (warning.id.startsWith("overlap-")) return "time_overlap";
  return null;
}

function sessionLabelForItem(
  item: SeminarAgendaItemInput,
  index: number,
): string {
  return item.title?.trim() || `เซสชัน ${index + 1}`;
}

export function buildAgendaWarningReport(
  items: SeminarAgendaItemInput[],
  options?: { dirty?: boolean },
): AgendaWarningReport {
  const warnings = validateAgendaItems(items, options);
  const issues: AgendaWarningIssue[] = [];

  for (const warning of warnings) {
    const category = agendaWarningCategory(warning);
    if (!category || !warning.itemId || warning.severity === "info") continue;

    const itemIndex = items.findIndex(
      (item, index) => agendaItemKey(item, index) === warning.itemId,
    );
    if (itemIndex < 0) continue;

    issues.push({
      warningId: warning.id,
      category,
      message: warning.message,
      severity: warning.severity,
      itemId: warning.itemId,
      itemIndex,
      sessionLabel: sessionLabelForItem(items[itemIndex], itemIndex),
    });
  }

  const affectedSessionCount = new Set(issues.map((issue) => issue.itemId)).size;
  const groupedIssues = Object.fromEntries(
    WARNING_CATEGORY_ORDER.map((category) => [category, [] as AgendaWarningIssue[]]),
  ) as Record<AgendaWarningCategory, AgendaWarningIssue[]>;

  for (const issue of issues) {
    groupedIssues[issue.category].push(issue);
  }

  return {
    totalIssueCount: issues.length,
    affectedSessionCount,
    issues,
    groupedIssues,
  };
}

export function validateAgendaItems(
  items: SeminarAgendaItemInput[],
  options?: { dirty?: boolean },
): SeminarAgendaWarning[] {
  const warnings: SeminarAgendaWarning[] = [];

  if (options?.dirty) {
    warnings.push({
      id: "unsaved",
      message: t.warningUnsaved,
      severity: "warning",
    });
  }

  if (items.length === 0) {
    warnings.push({
      id: "no-sessions",
      message: t.warningNoSessions,
      severity: "warning",
    });
    return warnings;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemId = agendaItemKey(item, i);

    if (!item.title?.trim()) {
      warnings.push({
        id: `missing-title-${itemId}`,
        message: t.warningMissingTitle(i),
        severity: "warning",
        itemId,
      });
    }

    const hasStart = Boolean(item.start_time?.trim());
    const hasEnd = Boolean(item.end_time?.trim());
    if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
      warnings.push({
        id: `missing-time-${itemId}`,
        message: t.warningMissingTime(item.title?.trim() || `เซสชัน ${i + 1}`),
        severity: "warning",
        itemId,
      });
    }

    if (!item.primary_speaker?.trim()) {
      warnings.push({
        id: `missing-speaker-${itemId}`,
        message: t.warningMissingSpeaker(
          item.title?.trim() || `เซสชัน ${i + 1}`,
        ),
        severity: "warning",
        itemId,
      });
    }

    if (!item.owner_name?.trim()) {
      warnings.push({
        id: `missing-owner-${itemId}`,
        message: t.warningMissingOwner(item.title?.trim() || `เซสชัน ${i + 1}`),
        severity: "warning",
        itemId,
      });
    }

    if (hasStart && hasEnd) {
      const duration = calcDurationMinutes(
        item.start_time,
        item.end_time,
        item.duration_minutes,
      );
      if (duration == null || duration <= 0) {
        warnings.push({
          id: `invalid-duration-${itemId}`,
          message: t.warningInvalidDuration(
            item.title?.trim() || `เซสชัน ${i + 1}`,
          ),
          severity: "error",
          itemId,
        });
      }
    }
  }

  const timeItems: AgendaTimeItem[] = items.map((item, index) => ({
    ...item,
    id: agendaItemKey(item, index),
    title: item.title,
  }));

  const overlaps = detectAgendaOverlaps(timeItems);
  for (const overlap of overlaps) {
    const a = items.find(
      (item, idx) => agendaItemKey(item, idx) === overlap.itemAId,
    );
    const b = items.find(
      (item, idx) => agendaItemKey(item, idx) === overlap.itemBId,
    );
    const bothParallel = a?.is_parallel && b?.is_parallel;
    const severity = bothParallel ? "info" : "error";
    const message = t.warningTimeOverlap(overlap.itemATitle, overlap.itemBTitle);
    const relatedItemIds = [overlap.itemAId, overlap.itemBId];

    warnings.push({
      id: `overlap-${overlap.itemAId}-${overlap.itemBId}`,
      message,
      severity,
      itemId: overlap.itemAId,
      relatedItemIds,
    });
    if (!bothParallel) {
      warnings.push({
        id: `overlap-b-${overlap.itemBId}-${overlap.itemAId}`,
        message,
        severity,
        itemId: overlap.itemBId,
        relatedItemIds,
      });
    }
  }

  const parallelOverlaps = overlaps.filter((overlap) => {
    const a = items.find(
      (item, idx) => agendaItemKey(item, idx) === overlap.itemAId,
    );
    const b = items.find(
      (item, idx) => agendaItemKey(item, idx) === overlap.itemBId,
    );
    return a?.is_parallel && b?.is_parallel;
  });
  if (parallelOverlaps.length > 0) {
    warnings.push({
      id: "parallel-overlap-count",
      message: t.warningParallelOverlap(parallelOverlaps.length),
      severity: "info",
    });
  }

  return warnings;
}

export function countIncompleteAgendaItems(
  items: SeminarAgendaItemInput[],
): number {
  return items.filter((item) => {
    const hasStart = Boolean(item.start_time?.trim());
    const hasEnd = Boolean(item.end_time?.trim());
    const hasTime = hasStart && hasEnd;
    const hasSpeaker = Boolean(item.primary_speaker?.trim());
    const hasOwner = Boolean(item.owner_name?.trim());
    const hasTitle = Boolean(item.title?.trim());
    return !hasTitle || !hasTime || !hasSpeaker || !hasOwner;
  }).length;
}

export function countAgendaOverlaps(items: SeminarAgendaItemInput[]): number {
  const timeItems: AgendaTimeItem[] = items.map((item, index) => ({
    ...item,
    id: agendaItemKey(item, index),
    title: item.title,
  }));
  return detectAgendaOverlaps(timeItems).length;
}

export function warningsForAgendaItem(
  item: SeminarAgendaItemInput,
  index: number,
  allItems: SeminarAgendaItemInput[],
): SeminarAgendaWarning[] {
  const itemId = agendaItemKey(item, index);
  return validateAgendaItems(allItems).filter(
    (w) =>
      w.itemId === itemId ||
      w.relatedItemIds?.includes(itemId) ||
      w.id.includes(itemId),
  );
}

export function hasAgendaItemWarnings(
  item: SeminarAgendaItemInput,
  index: number,
  allItems: SeminarAgendaItemInput[],
): boolean {
  return warningsForAgendaItem(item, index, allItems).some(
    (w) => w.severity === "warning" || w.severity === "error",
  );
}

export function agendaItemWarningSeverity(
  item: SeminarAgendaItemInput,
  index: number,
  allItems: SeminarAgendaItemInput[],
): "error" | "warning" | null {
  const warnings = warningsForAgendaItem(item, index, allItems).filter(
    (w) => w.severity !== "info",
  );
  if (warnings.some((w) => w.severity === "error")) return "error";
  if (warnings.some((w) => w.severity === "warning")) return "warning";
  return null;
}
