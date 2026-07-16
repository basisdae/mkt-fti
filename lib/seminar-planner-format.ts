import type {
  SeminarEventFormat,
  SeminarEventStatus,
} from "@/types/seminar-planner";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";

export const SEMINAR_EVENT_STATUS_LABELS: Record<SeminarEventStatus, string> =
  {
    idea: "ไอเดีย",
    planning: "วางแผน",
    pending_review: "รอตรวจสอบ",
    needs_revision: "ต้องแก้ไข",
    approved: "อนุมัติแล้ว",
    ready_to_execute: "พร้อมจัด",
    completed: "เสร็จสิ้น",
    on_hold: "พักชั่วคราว",
  };

export const SEMINAR_EVENT_FORMAT_LABELS: Record<SeminarEventFormat, string> =
  {
    on_site: "On-site",
    online: "Online",
    hybrid: "Hybrid",
  };

/** Muted badge classes per event status (Tailwind). */
export function seminarEventStatusBadgeClass(
  status: SeminarEventStatus,
  archived = false,
): string {
  if (archived) return "bg-gray-100 text-gray-500";

  switch (status) {
    case "idea":
      return "bg-slate-50 text-slate-600";
    case "planning":
      return "bg-blue-50 text-blue-700";
    case "pending_review":
      return "bg-violet-50 text-violet-700";
    case "needs_revision":
      return "bg-amber-50 text-amber-800";
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "ready_to_execute":
      return "bg-teal-50 text-teal-700";
    case "completed":
      return "bg-gray-100 text-gray-600";
    case "on_hold":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function formatSeminarMinutes(
  value: number | null | undefined,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("th-TH")} ${t.minutesUnit}`;
}

export function formatSeminarDateRange(
  start: string | null,
  end: string | null,
): string {
  if (!start && !end) return "—";
  if (start && end && start !== end) return `${start} – ${end}`;
  return start ?? end ?? "—";
}
