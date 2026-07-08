"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { usePipelineStore } from "@/hooks/PipelineStore";
import {
  daysLeftInRecycleBin,
  isRecycleItemExpired,
  listRecycleBinItems,
  RECYCLE_BIN_RETENTION_DAYS,
  type RecycleBinItem,
} from "@/lib/recycle-bin";
import { timeAgo } from "@/lib/utils";

export function RecycleBinView() {
  const { purgeProduct, restoreProduct } = usePipelineStore();
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const refresh = useCallback(() => {
    setItems(listRecycleBinItems());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRestore(item: RecycleBinItem) {
    if (item.entityType !== "product") return;
    setBusyId(item.id);
    try {
      await restoreProduct(item.entityId, item.id);
      refresh();
      setToast({
        title: "Restored",
        message: `"${item.name}" is back in the product catalog.`,
        variant: "success",
      });
    } catch (err) {
      setToast({
        title: "Restore failed",
        message: err instanceof Error ? err.message : "Could not restore",
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handlePermanentDelete(item: RecycleBinItem) {
    if (item.entityType !== "product") return;
    const confirmed = window.confirm(
      `Permanently delete "${item.name}"?\nThis cannot be undone.`,
    );
    if (!confirmed) return;

    setBusyId(item.id);
    try {
      await purgeProduct(item.entityId, item.id);
      refresh();
      setToast({
        title: "Permanently deleted",
        message: `"${item.name}" was removed forever.`,
        variant: "success",
      });
    } catch (err) {
      setToast({
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Could not delete",
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-shell">
      <div className="mb-4">
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Settings
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Recycle Bin
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Deleted products stay here for {RECYCLE_BIN_RETENTION_DAYS} days.
          Archive is separate and does not use Recycle Bin.
        </p>
      </div>

      <Card>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center text-sm text-gray-500">
            Recycle Bin is empty.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => {
              const expired = isRecycleItemExpired(item);
              const daysLeft = daysLeftInRecycleBin(item);
              const busy = busyId === item.id;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Trash2 className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {item.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {item.code || "—"}
                        {item.subtitle ? ` · ${item.subtitle}` : ""}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        Deleted {timeAgo(item.deletedAt)}
                        {" · "}
                        {expired
                          ? "Expired — permanent delete recommended"
                          : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy || expired}
                      onClick={() => void handleRestore(item)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-fti-red hover:bg-red-50"
                      disabled={busy}
                      onClick={() => void handlePermanentDelete(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Permanent Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {toast && (
        <Toast
          title={toast.title}
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
