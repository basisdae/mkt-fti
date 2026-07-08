"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  formatActivityLabel,
  listRecentActivity,
  type ActivityLogEntry,
} from "@/lib/activity-log";
import { timeAgo } from "@/lib/utils";

export function ActivityLogSettings() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listRecentActivity(20);
      setEntries(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Recent Activity
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Read-only audit of product, supplier, and export actions. Latest
              20 events.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => void reload()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading activity…</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No activity logged yet. Create, update, archive, delete, or export to
          see events here.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {formatActivityLabel(entry.action)}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {entry.entityName || entry.entityId || "—"}
                  {entry.userEmail ? (
                    <span className="text-gray-400">
                      {" "}
                      · {entry.userEmail}
                    </span>
                  ) : null}
                </p>
              </div>
              <p className="shrink-0 text-[11px] text-gray-400">
                {timeAgo(entry.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
