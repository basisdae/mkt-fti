"use client";

import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";

const SAFETY_ITEMS = [
  "Backup before schema change",
  "Never delete production data without confirmation",
  "Prefer archive over delete",
  "Test import on sample first",
  "Export before bulk update",
] as const;

export function DeveloperSafetyChecklist() {
  return (
    <Card>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">
              Developer Safety Checklist
            </h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Internal
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Reminders before risky work on live product and supplier data. UI
            only — not enforced by the app.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {SAFETY_ITEMS.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5"
          >
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 bg-white"
              aria-hidden
            />
            <span className="text-sm font-medium text-gray-800">{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
