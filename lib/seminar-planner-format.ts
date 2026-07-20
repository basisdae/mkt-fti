import type {
  SeminarEventFormat,
  SeminarEventStatus,
} from "@/types/seminar-planner";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import { normalizeTimeInput } from "@/lib/seminar-planner-time";

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

/** Display labels for session workflow statuses (DB `status_name` stays English). */
export const SEMINAR_SESSION_STATUS_LABELS: Record<string, string> = {
  Idea: "ไอเดีย",
  Draft: "แบบร่าง",
  "Need Detail": "รอรายละเอียด",
  Confirmed: "ยืนยันแล้ว",
  Assigned: "มอบหมายแล้ว",
  Ready: "พร้อม",
  "Cancel / Hold": "ยกเลิก / พักไว้",
};

export const SEMINAR_SESSION_STATUS_UNSET_LABEL = "ยังไม่กำหนด";

export function formatSeminarSessionStatusLabel(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim();
  if (!trimmed) return SEMINAR_SESSION_STATUS_UNSET_LABEL;
  return SEMINAR_SESSION_STATUS_LABELS[trimmed] ?? trimmed;
}

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

/** Display clock time in 24h with Thai suffix, e.g. "15:42 น." */
export function formatSeminarClockTime(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return "—";
  const normalized = normalizeTimeInput(value);
  if (!normalized) return "—";
  return `${normalized} น.`;
}

/** Display time range in 24h, e.g. "15:42–16:02 น." */
export function formatSeminarClockRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  const startNorm = start?.trim() ? normalizeTimeInput(start) : "";
  const endNorm = end?.trim() ? normalizeTimeInput(end) : "";
  if (startNorm && endNorm) return `${startNorm}–${endNorm} น.`;
  if (startNorm) return `${startNorm} น.`;
  if (endNorm) return `${endNorm} น.`;
  return "—";
}
