"use client";

import {
  SEMINAR_EVENT_STATUS_LABELS,
  seminarEventStatusBadgeClass,
} from "@/lib/seminar-planner-format";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type { SeminarEventStatus } from "@/types/seminar-planner";
import { cn } from "@/lib/utils";

interface SeminarEventStatusBadgeProps {
  status: SeminarEventStatus;
  archived?: boolean;
  className?: string;
}

export function SeminarEventStatusBadge({
  status,
  archived = false,
  className,
}: SeminarEventStatusBadgeProps) {
  const label = archived ? t.statusArchived : SEMINAR_EVENT_STATUS_LABELS[status];

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        seminarEventStatusBadgeClass(status, archived),
        className,
      )}
    >
      {label}
    </span>
  );
}
