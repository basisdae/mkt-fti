import type { MktWorkPriority, MktWorkStatus } from "@/types/monthly-plan";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";

export function formatWorkStatusLabel(status: MktWorkStatus): string {
  switch (status) {
    case "PLAN":
      return t.statusPlan;
    case "WORK":
      return t.statusWork;
    case "DONE":
      return t.statusDone;
    default:
      return status;
  }
}

export function formatWorkPriorityLabel(
  priority: MktWorkPriority | null | undefined,
): string | null {
  if (!priority) return null;
  switch (priority) {
    case "LOW":
      return t.priorityLow;
    case "MEDIUM":
      return t.priorityMedium;
    case "HIGH":
      return t.priorityHigh;
    default:
      return priority;
  }
}

export function formatWorkProgress(done: number, total: number): string {
  if (total <= 0) return "—";
  return `${done}/${total}`;
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

export const MONTHLY_PLAN_NEW_WORK_ID = "__monthly_plan_new__";

export function currentPlanYear(): number {
  return new Date().getFullYear();
}

export function monthTheme(month: number) {
  const index = Math.min(Math.max(month, 1), 12) - 1;
  return {
    month,
    label: t.months[index],
    ...({
      accent: ["#4F46E5", "#7C3AED", "#2563EB", "#0891B2", "#059669", "#16A34A", "#CA8A04", "#EA580C", "#DC2626", "#DB2777", "#9333EA", "#0D9488"][index],
      soft: ["#EEF2FF", "#F5F3FF", "#EFF6FF", "#ECFEFF", "#ECFDF5", "#F0FDF4", "#FEFCE8", "#FFF7ED", "#FEF2F2", "#FDF2F8", "#FAF5FF", "#F0FDFA"][index],
      border: ["#C7D2FE", "#DDD6FE", "#BFDBFE", "#A5F3FC", "#A7F3D0", "#BBF7D0", "#FEF08A", "#FED7AA", "#FECACA", "#FBCFE8", "#E9D5FF", "#99F6E4"][index],
    }),
  };
}

export const UNPLANNED_THEME = {
  accent: "#64748B",
  soft: "#F8FAFC",
  border: "#E2E8F0",
} as const;

export function bucketId(
  year: number,
  planMonth: number | null,
): string {
  if (planMonth == null) return `bucket:${year}:unplanned`;
  return `bucket:${year}:${planMonth}`;
}

export function parseBucketId(id: string): {
  year: number;
  planMonth: number | null;
} | null {
  const match = /^bucket:(\d+):(unplanned|\d{1,2})$/.exec(id);
  if (!match) return null;
  const year = Number(match[1]);
  if (match[2] === "unplanned") return { year, planMonth: null };
  const planMonth = Number(match[2]);
  if (planMonth < 1 || planMonth > 12) return null;
  return { year, planMonth };
}
