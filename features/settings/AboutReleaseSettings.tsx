"use client";

import { Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  APP_LAST_UPDATE,
  APP_RELEASE_NOTES,
  APP_VERSION,
} from "@/lib/constants";

export function AboutReleaseSettings() {
  return (
    <Card>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Info className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-900">About</h2>
          <p className="mt-1 text-sm text-gray-500">
            Application version and latest release notes.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Version
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">{APP_VERSION}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Last update
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {APP_LAST_UPDATE}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Latest changes
        </p>
        <ul className="mt-2 space-y-1.5">
          {APP_RELEASE_NOTES.map((note) => (
            <li
              key={note}
              className="flex gap-2 text-sm leading-snug text-gray-700"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
