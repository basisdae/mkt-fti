"use client";

import { useEffect, useState } from "react";
import {
  formatHistoryRole,
  listProductHistory,
} from "@/lib/product-history";
import { formatDate } from "@/lib/utils";
import type { ProductHistoryEntry } from "@/types/product-history";

interface ProductHistoryLogProps {
  productId: string;
  /** Bump to force reload after saves on the same page. */
  refreshKey?: number | string;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function ProductHistoryLog({
  productId,
  refreshKey = 0,
}: ProductHistoryLogProps) {
  const [entries, setEntries] = useState<ProductHistoryEntry[]>([]);

  useEffect(() => {
    setEntries(listProductHistory(productId));
  }, [productId, refreshKey]);

  if (entries.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center text-sm text-gray-500">
        No change history yet. Edits to profile, specification, gallery, pricing,
        score, ISO, and certificates will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {entry.action}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                <span className="font-medium text-gray-700">
                  {entry.userName}
                </span>
                {" · "}
                {formatHistoryRole(String(entry.userRole))}
              </p>
            </div>
            <time
              dateTime={entry.occurredAt}
              className="text-xs font-medium tabular-nums text-gray-400"
              title={formatDate(entry.occurredAt)}
            >
              {formatDateTime(entry.occurredAt)}
            </time>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-3 py-2">Field</th>
                  <th className="px-3 py-2">Old value</th>
                  <th className="px-3 py-2">New value</th>
                </tr>
              </thead>
              <tbody>
                {entry.changes.map((change, index) => (
                  <tr
                    key={`${entry.id}-${change.field}-${index}`}
                    className="border-t border-gray-50"
                  >
                    <td className="px-3 py-2 font-medium text-gray-700">
                      {change.field}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-gray-400">
                      {change.oldValue}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 font-medium text-gray-900">
                      {change.newValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}
