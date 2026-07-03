"use client";

import {
  ClipboardCheck,
  Package,
  Rocket,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TodaySummaryMetrics } from "@/lib/dashboard-summary";

interface TodaySummaryProps {
  metrics: TodaySummaryMetrics;
  dateLabel: string;
  className?: string;
}

const SUMMARY_ITEMS: {
  key: keyof TodaySummaryMetrics;
  label: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
}[] = [
  {
    key: "productsInProgress",
    label: "Products in Progress",
    hint: "Active sourcing & development",
    icon: Package,
    accent: "from-light-purple/90 via-white to-light-purple/40",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    key: "waitingApproval",
    label: "Waiting Approval",
    hint: "Purchase committee queue",
    icon: ClipboardCheck,
    accent: "from-amber-50/90 via-white to-amber-50/30",
    iconBg: "bg-amber-100/80 text-amber-700",
  },
  {
    key: "shipping",
    label: "Shipping",
    hint: "In transit to warehouse",
    icon: Truck,
    accent: "from-sky-50/90 via-white to-sky-50/30",
    iconBg: "bg-sky-100/80 text-sky-700",
  },
  {
    key: "readyLaunch",
    label: "Ready Launch",
    hint: "Launch-ready this quarter",
    icon: Rocket,
    accent: "from-green-50/90 via-white to-green-50/30",
    iconBg: "bg-green-100/80 text-success",
  },
];

export function TodaySummary({ metrics, dateLabel, className }: TodaySummaryProps) {
  return (
    <section className={cn("dashboard-today-summary", className)}>
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/70">
            Today&apos;s Summary
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            {dateLabel}
          </h2>
        </div>
        <p className="text-xs text-gray-400">Live pipeline snapshot</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const value = metrics[item.key];

          return (
            <article
              key={item.key}
              className={cn(
                "dashboard-summary-card group relative overflow-hidden rounded-[22px] border border-white/80 bg-gradient-to-br p-5 shadow-[0_8px_30px_-12px_rgb(105_92_255_0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgb(105_92_255_0.22)] sm:p-6",
                item.accent,
              )}
            >
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.04] blur-2xl transition-transform duration-500 group-hover:scale-110"
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                    item.iconBg,
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <p className="text-3xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-4xl">
                  {value}
                </p>
              </div>
              <p className="relative mt-4 text-sm font-semibold text-gray-800">
                {item.label}
              </p>
              <p className="relative mt-1 text-xs text-gray-500">{item.hint}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
