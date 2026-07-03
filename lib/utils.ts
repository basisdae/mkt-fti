import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ProductStatus } from "@/types/product";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyTHB(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

/** @deprecated Use formatCurrencyTHB */
export const formatCurrency = formatCurrencyTHB;

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatSignedGp(value: number): string {
  return `+${value.toFixed(1)}%`;
}

export function getStatusColor(status: ProductStatus): {
  bg: string;
  text: string;
  badge: "default" | "success" | "warning" | "danger" | "muted";
} {
  const map: Record<
    ProductStatus,
    { bg: string; text: string; badge: "default" | "success" | "warning" | "danger" | "muted" }
  > = {
    interested: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      badge: "muted",
    },
    researching: {
      bg: "bg-sky-50",
      text: "text-sky-700",
      badge: "default",
    },
    contact_factory: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      badge: "warning",
    },
    waiting_moq: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      badge: "warning",
    },
    quotation: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      badge: "warning",
    },
    sample_testing: {
      bg: "bg-light-purple",
      text: "text-primary",
      badge: "default",
    },
    certification: {
      bg: "bg-light-purple",
      text: "text-primary",
      badge: "default",
    },
    purchase_approved: {
      bg: "bg-light-purple",
      text: "text-primary",
      badge: "default",
    },
    ordered: {
      bg: "bg-light-purple",
      text: "text-primary",
      badge: "default",
    },
    shipping: {
      bg: "bg-green-50",
      text: "text-success",
      badge: "success",
    },
    received: {
      bg: "bg-green-50",
      text: "text-success",
      badge: "success",
    },
    ready_launch: {
      bg: "bg-green-50",
      text: "text-success",
      badge: "success",
    },
    launched: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      badge: "success",
    },
  };

  return map[status];
}

const TIME_AGO_STRINGS = [
  "Just now",
  "15 min ago",
  "1 hour ago",
  "2 hours ago",
  "5 hours ago",
  "Yesterday",
  "2 days ago",
  "3 days ago",
  "1 week ago",
];

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 1) return TIME_AGO_STRINGS[0];
  if (diffHours < 2) return TIME_AGO_STRINGS[2];
  if (diffHours < 3) return TIME_AGO_STRINGS[3];
  if (diffHours < 6) return TIME_AGO_STRINGS[4];
  if (diffDays < 1) return TIME_AGO_STRINGS[5];
  if (diffDays < 2) return TIME_AGO_STRINGS[6];
  if (diffDays < 4) return TIME_AGO_STRINGS[7];
  if (diffDays < 8) return TIME_AGO_STRINGS[8];
  return formatDate(dateString);
}

export function calcGpPercent(selling: number, cost: number): number {
  if (selling === 0) return 0;
  return ((selling - cost) / selling) * 100;
}
