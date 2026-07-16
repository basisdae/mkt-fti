"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
  Plus,
  Search,
} from "lucide-react";
import { DeleteGiftPlanDialog } from "@/components/gift-plan/DeleteGiftPlanDialog";
import { GiftPlanCard } from "@/components/gift-plan/GiftPlanCard";
import { NewGiftPlanDialog } from "@/components/gift-plan/NewGiftPlanDialog";
import { RenameGiftPlanDialog } from "@/components/gift-plan/RenameGiftPlanDialog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/forms/Select";
import { useAuth } from "@/hooks/AuthStore";
import {
  createGiftPlanAction,
  deleteGiftPlanAction,
  duplicateGiftPlanAction,
  getGiftPlanExportBundleAction,
  listGiftPlanSummariesAction,
  renameGiftPlanAction,
  setGiftPlanArchivedAction,
} from "@/lib/actions/gift-plans";
import {
  canEditGiftPlans,
  canExportGiftPlans,
} from "@/lib/auth/permissions";
import { downloadGiftPlanExport, exportGiftPlanWorkbook } from "@/lib/gift-plan-export";
import type { GiftPlanListSummary } from "@/types/gift-plan";
import { cn } from "@/lib/utils";

type TabKey = "active" | "draft" | "archived";
type SortKey = "updated" | "name" | "year";

export function GiftPlansHomeView() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canEditGiftPlans(user);
  const canExport = canExportGiftPlans(user);
  const showCosts = canEdit || canExport;

  const [plans, setPlans] = useState<GiftPlanListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("active");
  const [sort, setSort] = useState<SortKey>("updated");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [renameTarget, setRenameTarget] = useState<GiftPlanListSummary | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GiftPlanListSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    setLoading(true);
    const result = await listGiftPlanSummariesAction();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      setPlans([]);
      return;
    }
    setError(null);
    setPlans(result.data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    function onPointerDown() {
      setMenuId(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const visible = useMemo(() => {
    const filtered = plans.filter((plan) => {
      if (tab === "archived") return plan.is_archived;
      if (plan.is_archived) return false;
      if (tab === "draft") return plan.status === "draft";
      return plan.status !== "draft";
    });

    const q = query.trim().toLowerCase();
    const searched = q
      ? filtered.filter(
          (plan) =>
            plan.name.toLowerCase().includes(q) ||
            String(plan.campaign_year).includes(q) ||
            plan.owner.toLowerCase().includes(q),
        )
      : filtered;

    return [...searched].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "year") return b.campaign_year - a.campaign_year;
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [plans, query, tab, sort]);

  async function handleCreate(input: { name: string; campaign_year: number }) {
    setCreating(true);
    setCreateError(null);
    const result = await createGiftPlanAction(input);
    setCreating(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }
    setNewOpen(false);
    router.push(`/gift-plans/${result.data.id}`);
  }

  async function handleExport(plan: GiftPlanListSummary) {
    const result = await getGiftPlanExportBundleAction(plan.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const exported = await exportGiftPlanWorkbook(result.data);
    downloadGiftPlanExport(exported.buffer, exported.fileName);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Customer Gift Plans
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Gift Plans</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            MKT HQ prepares customer gift plans here. Export the Communication
            Report to share with sales teams and graphic production — sales do
            not log in to this module.
          </p>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/gift-plans/catalog")}
            >
              Gift Catalog
            </Button>
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" />
              New Plan
            </Button>
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-gray-200 bg-white p-1">
          {(["active", "draft", "archived"] as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                tab === key
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50",
              )}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plans…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="w-40"
          options={[
            { value: "updated", label: "Last Updated" },
            { value: "name", label: "Name" },
            { value: "year", label: "Campaign Year" },
          ]}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">Loading gift plans…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <Gift className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-700">No plans in this tab</p>
          <p className="mt-1 text-sm text-gray-500">
            {canEdit
              ? "Create a new gift plan to get started."
              : "No published gift plans are available yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((plan) => (
            <GiftPlanCard
              key={plan.id}
              plan={plan}
              canEdit={canEdit}
              canExport={canExport}
              showCosts={showCosts}
              menuOpen={menuId === plan.id}
              onToggleMenu={() =>
                setMenuId((current) => (current === plan.id ? null : plan.id))
              }
              onOpen={() => router.push(`/gift-plans/${plan.id}`)}
              onDuplicate={async () => {
                const result = await duplicateGiftPlanAction(plan.id);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                router.push(`/gift-plans/${result.data.id}`);
              }}
              onRename={() => setRenameTarget(plan)}
              onArchive={async () => {
                const result = await setGiftPlanArchivedAction(plan.id, true);
                if (!result.ok) setError(result.error);
                else void refresh();
              }}
              onUnarchive={async () => {
                const result = await setGiftPlanArchivedAction(plan.id, false);
                if (!result.ok) setError(result.error);
                else void refresh();
              }}
              onDelete={() => setDeleteTarget(plan)}
              onExport={() => void handleExport(plan)}
            />
          ))}
        </div>
      )}

      <NewGiftPlanDialog
        open={newOpen}
        creating={creating}
        error={createError}
        onCancel={() => setNewOpen(false)}
        onCreate={handleCreate}
      />

      <RenameGiftPlanDialog
        open={Boolean(renameTarget)}
        initialName={renameTarget?.name ?? ""}
        error={renameError}
        onCancel={() => {
          setRenameTarget(null);
          setRenameError(null);
        }}
        onSave={async (name) => {
          if (!renameTarget) return;
          const result = await renameGiftPlanAction(renameTarget.id, name);
          if (!result.ok) {
            setRenameError(result.error);
            return;
          }
          setRenameTarget(null);
          void refresh();
        }}
      />

      <DeleteGiftPlanDialog
        open={Boolean(deleteTarget)}
        planName={deleteTarget?.name ?? ""}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          const result = await deleteGiftPlanAction(deleteTarget.id);
          setDeleting(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setDeleteTarget(null);
          void refresh();
        }}
      />
    </div>
  );
}
