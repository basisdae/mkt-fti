"use client";

import { useEffect, useState } from "react";
import { Copy, Download, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import {
  deleteSimulatorPlan,
  duplicateSimulatorPlan,
  formatPlanMoney,
  listSimulatorPlans,
  renameSimulatorPlan,
  type SimulatorPlan,
} from "@/lib/simulator-plans";
import { timeAgo } from "@/lib/utils";

interface SimulatorPlansModalProps {
  open: boolean;
  onClose: () => void;
  onOpenPlan: (plan: SimulatorPlan) => void;
  onExportPlan: (plan: SimulatorPlan) => void | Promise<void>;
}

export function SimulatorPlansModal({
  open,
  onClose,
  onOpenPlan,
  onExportPlan,
}: SimulatorPlansModalProps) {
  const [plans, setPlans] = useState<SimulatorPlan[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  function refresh() {
    setPlans(listSimulatorPlans());
  }

  useEffect(() => {
    if (open) {
      refresh();
      setRenamingId(null);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function handleDuplicate(planId: string) {
    const result = duplicateSimulatorPlan(planId);
    if (!result.ok) {
      setError(result.error ?? "Duplicate failed");
      return;
    }
    refresh();
  }

  function handleDelete(plan: SimulatorPlan) {
    const confirmed = window.confirm(
      `Delete saved plan "${plan.name}"?\nThis cannot be undone.`,
    );
    if (!confirmed) return;
    const ok = deleteSimulatorPlan(plan.id);
    if (!ok) {
      setError("Could not delete plan (localStorage unavailable).");
      return;
    }
    refresh();
  }

  function startRename(plan: SimulatorPlan) {
    setRenamingId(plan.id);
    setRenameValue(plan.name);
    setError(null);
  }

  function commitRename(planId: string) {
    const result = renameSimulatorPlan(planId, renameValue);
    if (!result.ok) {
      setError(result.error ?? "Rename failed");
      return;
    }
    setRenamingId(null);
    refresh();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulator-plans-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <h2
            id="simulator-plans-title"
            className="text-lg font-semibold text-gray-900"
          >
            Load Plan / Campaign
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Saved plans are stored in this browser only (localStorage).
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-fti-red">
              {error}
            </p>
          )}

          {plans.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              No saved plans yet. Enter a plan name and click Save Plan.
            </p>
          ) : (
            <ul className="space-y-3">
              {plans.map((plan) => (
                <li
                  key={plan.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3"
                >
                  {renamingId === plan.id ? (
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="min-w-[200px] flex-1">
                        <Input
                          label="Plan name"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitRename(plan.id);
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => commitRename(plan.id)}
                      >
                        Save name
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setRenamingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            {plan.name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Updated {timeAgo(plan.updatedAt)}
                            <span className="mx-1.5 text-gray-300">·</span>
                            {plan.summary.productCount} scenario
                            {plan.summary.productCount === 1 ? "" : "s"}
                            <span className="mx-1.5 text-gray-300">·</span>
                            Target{" "}
                            {formatPlanMoney(plan.summary.totalTargetRevenue)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onOpenPlan(plan)}
                          >
                            <FolderOpen className="h-3.5 w-3.5" />
                            Open
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={exportingId === plan.id}
                            onClick={() => {
                              setExportingId(plan.id);
                              void Promise.resolve(onExportPlan(plan)).finally(
                                () => setExportingId(null),
                              );
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            {exportingId === plan.id ? "…" : "Export"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDuplicate(plan.id)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Duplicate
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => startRename(plan)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Rename
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-fti-red hover:bg-red-50"
                            onClick={() => handleDelete(plan)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-3 text-right">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
