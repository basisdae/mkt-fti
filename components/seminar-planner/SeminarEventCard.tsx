"use client";

import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  Copy,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { SeminarEventStatusBadge } from "@/components/seminar-planner/SeminarEventStatusBadge";
import { Button } from "@/components/ui/Button";
import {
  formatSeminarDateRange,
  formatSeminarMinutes,
  SEMINAR_EVENT_FORMAT_LABELS,
} from "@/lib/seminar-planner-format";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type { SeminarEventSummary } from "@/types/seminar-planner";
import { cn, formatDate } from "@/lib/utils";

interface SeminarEventCardProps {
  event: SeminarEventSummary;
  eventHref: string;
  editHref: string;
  canEdit: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}

export function SeminarEventCard({
  event,
  eventHref,
  editHref,
  canEdit,
  menuOpen,
  onToggleMenu,
  onDuplicate,
  onArchive,
  onUnarchive,
  onDelete,
}: SeminarEventCardProps) {
  const archived = event.is_archived;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-200/40",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-md hover:shadow-primary/10",
      )}
    >
      <Link
        href={eventHref}
        className={cn(
          "absolute inset-0 z-0 rounded-2xl",
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        )}
        aria-label={`${t.openEvent}: ${event.title}`}
      />

      <div className="relative z-10 flex flex-1 flex-col pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-gray-900">
                {event.title}
              </h3>
              <SeminarEventStatusBadge status={event.status} archived={archived} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formatSeminarDateRange(event.start_date, event.end_date)}
              {event.owner ? ` · ${event.owner}` : ""}
            </p>
            {event.event_type ? (
              <p className="mt-0.5 text-xs text-gray-400">{event.event_type}</p>
            ) : null}
          </div>

          {canEdit ? (
            <div
              className="pointer-events-auto relative"
              data-seminar-event-menu
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleMenu();
                }}
                aria-label={t.eventActions}
                aria-expanded={menuOpen}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {menuOpen ? (
                <div
                  className="absolute right-0 top-9 z-20 min-w-[11rem] rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={eventHref}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => onToggleMenu()}
                  >
                    <FolderOpen className="h-4 w-4" /> {t.openEvent}
                  </Link>
                  <Link
                    href={editHref}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => onToggleMenu()}
                  >
                    <Pencil className="h-4 w-4" /> {t.editEvent}
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={onDuplicate}
                  >
                    <Copy className="h-4 w-4" /> {t.duplicate}
                  </button>
                  {archived ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      onClick={onUnarchive}
                    >
                      <ArchiveRestore className="h-4 w-4" /> {t.restore}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      onClick={onArchive}
                    >
                      <Archive className="h-4 w-4" /> {t.archive}
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fti-red hover:bg-red-50"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" /> {t.deleteEvent}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-gray-400">{t.sessions}</dt>
            <dd className="font-medium text-gray-800">
              {event.session_count.toLocaleString("th-TH")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">{t.totalMinutes}</dt>
            <dd className="font-medium text-gray-800">
              {formatSeminarMinutes(event.total_minutes)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">{t.eventFormat}</dt>
            <dd className="font-medium text-gray-800">
              {SEMINAR_EVENT_FORMAT_LABELS[event.event_format]}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">{t.owner}</dt>
            <dd className="truncate font-medium text-gray-800">
              {event.owner || "—"}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-[11px] text-gray-400">
          {t.updated} {formatDate(event.updated_at)}
        </p>
      </div>
    </article>
  );
}
