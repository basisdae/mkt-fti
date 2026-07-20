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
    warnings.push({
      id: `overlap-${overlap.itemAId}-${overlap.itemBId}`,
      message: t.warningTimeOverlap(overlap.itemATitle, overlap.itemBTitle),
      severity: bothParallel ? "info" : "error",
      itemId: overlap.itemAId,
    });
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
    (w) => w.itemId === itemId || w.id.includes(itemId),
  );
}
