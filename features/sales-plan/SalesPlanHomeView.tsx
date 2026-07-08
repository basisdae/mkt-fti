"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus, Search } from "lucide-react";
import { DeleteSalesProjectDialog } from "@/components/sales-plan/DeleteSalesProjectDialog";
import { NewSalesProjectDialog } from "@/components/sales-plan/NewSalesProjectDialog";
import { RenameSalesProjectDialog } from "@/components/sales-plan/RenameSalesProjectDialog";
import { SalesPlanProjectCard } from "@/components/sales-plan/SalesPlanProjectCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/forms/Select";
import {
  archiveSalesProject,
  createSalesProject,
  deleteSalesProject,
  duplicateSalesProject,
  filterAndSortProjects,
  listSalesProjects,
  renameSalesProject,
  SALES_PROJECTS_EVENT,
  unarchiveSalesProject,
  type SalesPlanProject,
  type SalesProjectSort,
} from "@/lib/sales-projects";
import { cn } from "@/lib/utils";

export function SalesPlanHomeView() {
  const router = useRouter();
  const [projects, setProjects] = useState<SalesPlanProject[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SalesProjectSort>("updated");
  const [showArchived, setShowArchived] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SalesPlanProject | null>(
    null,
  );
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalesPlanProject | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  function refresh() {
    setProjects(listSalesProjects({ includeArchived: true }));
  }

  useEffect(() => {
    refresh();
    function onChange() {
      refresh();
    }
    window.addEventListener(SALES_PROJECTS_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(SALES_PROJECTS_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  useEffect(() => {
    function onPointerDown() {
      setMenuId(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const visible = useMemo(
    () =>
      filterAndSortProjects(projects, {
        query,
        sort,
        showArchived,
      }),
    [projects, query, sort, showArchived],
  );

  function openProject(id: string) {
    router.push(`/simulator/${id}`);
  }

  function handleCreate(input: { name: string; description: string }) {
    setCreating(true);
    setCreateError(null);
    const result = createSalesProject(input);
    setCreating(false);
    if (!result.ok || !result.project) {
      setCreateError(result.error ?? "Could not create project.");
      return;
    }
    setNewOpen(false);
    refresh();
    router.push(`/simulator/${result.project.id}`);
  }

  function handleDuplicate(project: SalesPlanProject) {
    const result = duplicateSalesProject(project.id);
    if (result.ok) refresh();
    setMenuId(null);
  }

  function handleRename(name: string) {
    if (!renameTarget) return;
    const result = renameSalesProject(renameTarget.id, name);
    if (!result.ok) {
      setRenameError(result.error ?? "Rename failed.");
      return;
    }
    setRenameTarget(null);
    setRenameError(null);
    refresh();
  }

  function handleArchive(project: SalesPlanProject) {
    archiveSalesProject(project.id);
    setMenuId(null);
    refresh();
  }

  function handleUnarchive(project: SalesPlanProject) {
    unarchiveSalesProject(project.id);
    setMenuId(null);
    refresh();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    deleteSalesProject(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    refresh();
  }

  return (
    <div className="page-shell">
      <header className="page-header-block">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
              Sales Plans
            </p>
            <h1 className="page-title mt-2">Sales Plan Projects</h1>
            <p className="page-description mt-2 max-w-2xl">
              Create and manage multiple sales plan projects. Data stays in this
              browser only — products and suppliers are never modified.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0 self-start sm:self-auto"
            onClick={() => {
              setCreateError(null);
              setNewOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Sales Plan
          </Button>
        </div>
      </header>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Sort projects"
            className="min-w-[10rem] rounded-xl py-2 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as SalesProjectSort)}
            options={[
              { value: "updated", label: "Recently Updated" },
              { value: "name", label: "Name" },
              { value: "created", label: "Created Date" },
            ]}
          />
          <button
            type="button"
            onClick={() => setShowArchived((value) => !value)}
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
              showArchived
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            {showArchived ? "Showing Archived" : "Active only"}
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <FolderKanban className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-semibold text-gray-800">
            {showArchived ? "No archived projects" : "No sales plan projects yet"}
          </p>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            {query
              ? "Try a different search."
              : "Create a project to start building scenarios."}
          </p>
          {!showArchived && !query ? (
            <Button
              type="button"
              size="sm"
              className="mt-4"
              onClick={() => setNewOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Sales Plan
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((project) => (
            <div
              key={project.id}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <SalesPlanProjectCard
                project={project}
                menuOpen={menuId === project.id}
                onToggleMenu={() =>
                  setMenuId((id) => (id === project.id ? null : project.id))
                }
                onOpen={() => openProject(project.id)}
                onDuplicate={() => handleDuplicate(project)}
                onRename={() => {
                  setRenameError(null);
                  setRenameTarget(project);
                  setMenuId(null);
                }}
                onArchive={() => handleArchive(project)}
                onUnarchive={() => handleUnarchive(project)}
                onDelete={() => {
                  setDeleteTarget(project);
                  setMenuId(null);
                }}
              />
            </div>
          ))}
        </div>
      )}

      <NewSalesProjectDialog
        open={newOpen}
        creating={creating}
        error={createError}
        onCancel={() => setNewOpen(false)}
        onCreate={handleCreate}
      />

      <RenameSalesProjectDialog
        open={Boolean(renameTarget)}
        currentName={renameTarget?.name ?? ""}
        error={renameError}
        onCancel={() => setRenameTarget(null)}
        onRename={handleRename}
      />

      <DeleteSalesProjectDialog
        open={Boolean(deleteTarget)}
        projectName={deleteTarget?.name ?? ""}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
