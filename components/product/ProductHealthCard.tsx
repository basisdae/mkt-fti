"use client";

import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductHealthItem {
  id: string;
  label: string;
  done: boolean;
}

interface ProductHealthCardProps {
  items: ProductHealthItem[];
  className?: string;
}

export function ProductHealthCard({ items, className }: ProductHealthCardProps) {
  const doneCount = items.filter((item) => item.done).length;
  const percent =
    items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);
  const ready = percent >= 80;

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-200/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Product Health
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {ready ? "Product Ready" : "Needs Attention"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-primary">
            {percent}%
          </p>
          <p className="text-[10px] font-medium text-gray-400">Completed</p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            ready ? "bg-green-500" : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 text-xs text-gray-700"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                item.done
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-600",
              )}
            >
              {item.done ? (
                <Check className="h-3 w-3" strokeWidth={2.5} />
              ) : (
                <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />
              )}
            </span>
            <span className={item.done ? "text-gray-700" : "text-gray-500"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
