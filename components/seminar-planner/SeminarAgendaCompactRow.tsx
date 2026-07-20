"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  GripVertical,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SeminarAgendaSessionLibraryPicker } from "@/components/seminar-planner/SeminarAgendaSessionLibraryPicker";
import { SeminarTimeInput } from "@/components/seminar-planner/SeminarTimeInput";
import { resolveSeminarCategoryVisual } from "@/lib/seminar-agenda-category-colors";
import {
  formatSeminarCategoryLabel,
  shouldShowSessionStatusOnCard,
} from "@/lib/seminar-planner-category-labels";
import { agendaItemWarningSeverity } from "@/lib/seminar-planner-agenda-warnings";
import { isSeminarAgendaTap } from "@/lib/seminar-planner-agenda-dnd";
import { calcDurationMinutes } from "@/lib/seminar-planner-time";
import {
  formatSeminarClockRange,
  formatSeminarMinutes,
  formatSeminarSessionStatusLabel,
} from "@/lib/seminar-planner-format";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type { SeminarAgendaItemInput, SeminarLibSessionRow } from "@/types/seminar-planner";
import { cn } from "@/lib/utils";

interface SeminarAgendaCompactRowProps {
  sortId: string;
  item: SeminarAgendaItemInput;
  index: number;
  allItems: SeminarAgendaItemInput[];
  statusOptions: { value: string; label: string }[];
  disabled?: boolean;
  replacing?: boolean;
  savingOrder?: boolean;
  isDragging?: boolean;
  isDragOverlay?: boolean;
  expanded?: boolean;
  highlighted?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onChange: (item: SeminarAgendaItemInput) => void;
  onReplaceFromLibrary: (session: SeminarLibSessionRow) => void;
  onRemove: () => void;
  onViewSummary: () => void;
  onShortDetailBlur: () => void;
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-gray-50";

const actionButtonClass =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm";

export function SeminarAgendaCompactRow({
  sortId,
  item,
  index,
  allItems,
  statusOptions,
  disabled = false,
  replacing = false,
  savingOrder = false,
  isDragging = false,
  isDragOverlay = false,
  expanded = false,
  highlighted = false,
  onExpandedChange,
  onChange,
  onReplaceFromLibrary,
  onRemove,
  onViewSummary,
  onShortDetailBlur,
}: SeminarAgendaCompactRowProps) {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartedRef = useRef(false);
  const suppressDragRef = useRef(false);

  const warningSeverity = agendaItemWarningSeverity(item, index, allItems);
  const isEvenStripe = index % 2 === 1;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: sortId,
    disabled: disabled || isDragOverlay,
  });

  useEffect(() => {
    if (isSortableDragging) {
      dragStartedRef.current = true;
    }
  }, [isSortableDragging]);

  const duration = calcDurationMinutes(
    item.start_time,
    item.end_time,
    item.duration_minutes,
  );

  function patch(partial: Partial<SeminarAgendaItemInput>) {
    onChange({ ...item, ...partial });
  }

  function handleTimeChange(
    field: "start_time" | "end_time",
    value: string,
  ) {
    const next = { ...item, [field]: value || null };
    const mins = calcDurationMinutes(
      field === "start_time" ? value : next.start_time,
      field === "end_time" ? value : next.end_time,
      next.duration_minutes,
    );
    patch({
      [field]: value || null,
      duration_minutes: mins,
    });
  }

  const timeLabel = formatSeminarClockRange(item.start_time, item.end_time);
  const sessionTitle = item.title?.trim() || t.sessionTitle;
  const categoryName = item.category_name?.trim() || "";
  const categoryDisplay = formatSeminarCategoryLabel(categoryName);
  const categoryVisual = resolveSeminarCategoryVisual(
    categoryName,
    item.format_name,
  );
  const speakerLabel =
    item.primary_speaker?.trim() ||
    item.co_speakers?.trim() ||
    null;
  const statusLabel = formatSeminarSessionStatusLabel(item.status_name);
  const showStatusTag = shouldShowSessionStatusOnCard(item.status_name);
  const hasDuration =
    duration != null && Number.isFinite(duration) && duration > 0;
  const durationLabel = hasDuration
    ? formatSeminarMinutes(duration)
    : null;

  const style = isDragOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const lifted = isDragOverlay || isSortableDragging || isDragging;

  function blockCardInteraction(event: ReactPointerEvent<HTMLElement>) {
    event.stopPropagation();
    suppressDragRef.current = true;
    dragStartedRef.current = true;
    pointerStartRef.current = null;
  }

  const dragListeners =
    disabled || isDragOverlay || !listeners
      ? undefined
      : {
          ...listeners,
          onPointerDown(event: ReactPointerEvent<HTMLElement>) {
            if (suppressDragRef.current) {
              suppressDragRef.current = false;
              return;
            }
            pointerStartRef.current = {
              x: event.clientX,
              y: event.clientY,
            };
            dragStartedRef.current = false;
            listeners.onPointerDown?.(event);
          },
          onPointerMove(event: ReactPointerEvent<HTMLElement>) {
            if (
              !dragStartedRef.current &&
              pointerStartRef.current &&
              !isSeminarAgendaTap(pointerStartRef.current, {
                x: event.clientX,
                y: event.clientY,
              })
            ) {
              dragStartedRef.current = true;
            }
            listeners.onPointerMove?.(event);
          },
          onPointerUp(event: ReactPointerEvent<HTMLElement>) {
            listeners.onPointerUp?.(event);
            pointerStartRef.current = null;
            dragStartedRef.current = false;
            suppressDragRef.current = false;
          },
        };

  const actionButtons = (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(actionButtonClass, "px-3")}
        data-agenda-no-drag
        onPointerDown={blockCardInteraction}
        onClick={onViewSummary}
      >
        {t.viewSummary}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(actionButtonClass, "text-fti-red hover:bg-red-50")}
        data-agenda-no-drag
        onPointerDown={blockCardInteraction}
        onClick={onRemove}
        aria-label={t.removeSession}
        title={t.removeSession}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={actionButtonClass}
        data-agenda-no-drag
        onPointerDown={blockCardInteraction}
        onClick={() => onExpandedChange?.(!expanded)}
        aria-expanded={expanded}
        aria-label={t.expandSessionFields}
        title={t.expandSessionFields}
      >
        <ChevronDown
          className={cn("h-5 w-5 transition-transform", expanded && "rotate-180")}
        />
      </Button>
    </>
  );

  return (
    <article
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      data-agenda-row={sortId}
      {...(isDragOverlay ? {} : attributes)}
      {...(dragListeners ?? {})}
      onPointerDownCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("[data-agenda-no-drag]")) {
          blockCardInteraction(event);
        }
      }}
      className={cn(
        "scroll-mt-24 touch-manipulation rounded-lg border bg-white shadow-sm transition-colors select-none",
        isEvenStripe && !lifted && "bg-gray-50/70",
        !disabled && !isDragOverlay && "cursor-grab active:cursor-grabbing",
        warningSeverity === "error" && "border-orange-300",
        warningSeverity === "warning" && !expanded && "border-amber-200",
        !warningSeverity && "border-gray-200",
        expanded && "border-primary/35 ring-2 ring-primary/15",
        highlighted && "ring-2 ring-amber-400/80 bg-amber-50/80",
        lifted && "relative z-20 cursor-grabbing border-primary/30 shadow-md ring-2 ring-primary/25",
        savingOrder && !lifted && "opacity-90",
        "grid grid-cols-[auto_auto_minmax(0,1fr)_auto] gap-x-2 px-3 py-3 md:grid-cols-[auto_auto_9.5rem_minmax(0,1fr)_auto] md:gap-x-3",
      )}
    >
      <span
        className="col-start-1 row-start-1 mt-0.5 shrink-0 text-gray-400"
        aria-hidden
        title={disabled ? undefined : t.dragHandle}
      >
        <GripVertical className="h-5 w-5" />
      </span>

      <span className="col-start-2 row-start-1 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold tabular-nums text-primary">
        {index + 1}
      </span>

      <span
        className="col-start-3 row-start-1 mt-1 hidden shrink-0 text-sm font-semibold tabular-nums text-gray-800 md:block"
        title={timeLabel}
      >
        {timeLabel}
      </span>

      <div className="col-start-3 row-start-1 min-w-0 md:col-start-4">
        <p className="mb-1 text-sm font-semibold tabular-nums text-gray-800 md:hidden">
          {timeLabel}
        </p>

        <button
          type="button"
          data-agenda-no-drag
          onPointerDown={blockCardInteraction}
          onClick={onViewSummary}
          className="w-full text-left text-base font-semibold leading-snug text-gray-900 break-words hover:text-primary hover:underline md:text-[17px]"
        >
          {sessionTitle}
        </button>

        {(categoryDisplay ||
          durationLabel ||
          speakerLabel ||
          showStatusTag ||
          warningSeverity) ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {categoryDisplay ? (
              <span
                className="inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs font-semibold leading-snug break-words"
                style={{
                  backgroundColor: categoryVisual.tagBg,
                  color: categoryVisual.tagText,
                }}
              >
                {categoryDisplay}
              </span>
            ) : null}

            {durationLabel ? (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-700">
                {durationLabel}
              </span>
            ) : null}

            {speakerLabel ? (
              <span
                className="max-w-full text-xs leading-snug text-gray-600 break-words"
                title={speakerLabel}
              >
                {speakerLabel}
              </span>
            ) : null}

            {showStatusTag ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {statusLabel}
              </span>
            ) : null}

            {warningSeverity ? (
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full",
                  warningSeverity === "error"
                    ? "bg-red-100 text-fti-red"
                    : "bg-amber-100 text-amber-800",
                )}
                title={t.sessionWarningTooltip}
                aria-label={t.sessionWarningTooltip}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
        ) : null}

        <input
          type="text"
          value={item.agenda_short_detail ?? ""}
          disabled={disabled}
          placeholder={t.agendaShortDetailPlaceholder}
          aria-label={t.agendaShortDetail}
          data-agenda-no-drag
          onChange={(e) => patch({ agenda_short_detail: e.target.value })}
          onPointerDown={blockCardInteraction}
          onFocus={() => {
            if (!expanded) onExpandedChange?.(true);
          }}
          onBlur={() => {
            if (!disabled) onShortDetailBlur();
          }}
          className={cn(
            "mt-2 w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 py-1 text-sm leading-relaxed text-gray-700 break-words placeholder:text-gray-500",
            "outline-none focus:border-primary/30 focus:bg-white focus:px-2",
            "disabled:cursor-default disabled:text-gray-500",
          )}
        />
      </div>

      <div className="col-start-4 row-start-1 flex shrink-0 items-start gap-0.5 self-start md:col-start-5">
        {actionButtons}
      </div>

      {expanded ? (
        <div
          className="col-start-3 row-start-2 min-w-0 border-t border-gray-100 bg-white/80 pt-3 md:col-start-4"
          data-agenda-no-drag
        >
          {!disabled ? (
            <>
              <SeminarAgendaSessionLibraryPicker
                currentSessionId={item.library_session_id}
                currentTitle={item.title}
                currentCategory={item.category_name ?? ""}
                currentMinutes={duration ?? item.duration_minutes ?? null}
                disabled={disabled}
                busy={replacing}
                onSelect={onReplaceFromLibrary}
              />
              <p className="text-sm text-gray-500">{t.replaceFromLibraryHint}</p>
            </>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SeminarTimeInput
              label={t.startTime}
              value={item.start_time}
              disabled={disabled}
              onChange={(value) => handleTimeChange("start_time", value ?? "")}
              className="mt-1.5"
              data-agenda-no-drag
            />
            <SeminarTimeInput
              label={t.endTime}
              value={item.end_time}
              disabled={disabled}
              onChange={(value) => handleTimeChange("end_time", value ?? "")}
              className="mt-1.5"
              data-agenda-no-drag
            />
            <label className="block text-sm font-medium text-gray-700">
              {t.primarySpeaker}
              <input
                type="text"
                value={item.primary_speaker ?? ""}
                disabled={disabled}
                onChange={(e) => patch({ primary_speaker: e.target.value })}
                className={cn(inputClass, "mt-1.5")}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              {t.sessionStatus}
              <select
                value={item.status_name ?? ""}
                disabled={disabled}
                onChange={(e) => patch({ status_name: e.target.value })}
                className={cn(inputClass, "mt-1.5")}
              >
                <option value="">{formatSeminarSessionStatusLabel("")}</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              {t.sessionOwner}
              <input
                type="text"
                value={item.owner_name ?? ""}
                disabled={disabled}
                onChange={(e) => patch({ owner_name: e.target.value })}
                className={cn(inputClass, "mt-1.5")}
              />
            </label>
            <label className="flex min-h-10 items-center gap-2 text-sm text-gray-800 sm:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(item.is_parallel)}
                disabled={disabled}
                onChange={(e) => patch({ is_parallel: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t.parallelSession}
            </label>
            <label className="block text-sm font-medium text-gray-700 sm:col-span-2 lg:col-span-4">
              {t.teamNotes}
              <textarea
                value={item.team_notes ?? ""}
                disabled={disabled}
                rows={2}
                onChange={(e) => patch({ team_notes: e.target.value })}
                className={cn(inputClass, "mt-1.5 resize-y")}
              />
            </label>
          </div>
        </div>
      ) : null}
    </article>
  );
}
