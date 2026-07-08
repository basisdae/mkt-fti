"use client";

import {
  Archive,
  ArchiveRestore,
  Copy,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  formatProjectMoney,
  type SalesPlanProject,
} from "@/lib/sales-projects";
import { cn, formatDate } from "@/lib/utils";

interface SalesPlanProjectCardProps {
  project: SalesPlanProject;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpen: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}

export function SalesPlanProjectCard({
  project,
  menuOpen,
  onToggleMenu,
  onOpen,
  onDuplicate,
  onRename,
  onArchive,
  onUnarchive,
  onDelete,
}: SalesPlanProjectCardProps) {
  const archived = project.status === "archived";

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-200/40 transition-all",
        "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {project.name}
            </h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                archived
                  ? "bg-gray-100 text-gray-500"
                  : "bg-emerald-50 text-emerald-700",
              )}
            >
              {archived ? "Archived" : "Active"}
            </span>
          </div>
          {project.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {project.description}
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">No description</p>
          )}
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onToggleMenu}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Project actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              <MenuItem icon={FolderOpen} label="Open" onClick={onOpen} />
              <MenuItem icon={Copy} label="Duplicate" onClick={onDuplicate} />
              <MenuItem icon={Pencil} label="Rename" onClick={onRename} />
              {archived ? (
                <MenuItem
                  icon={ArchiveRestore}
                  label="Unarchive"
                  onClick={onUnarchive}
                />
              ) : (
                <MenuItem icon={Archive} label="Archive" onClick={onArchive} />
              )}
              <MenuItem
                icon={Trash2}
                label="Delete"
                onClick={onDelete}
                danger
              />
            </div>
          )}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <dt className="font-medium text-gray-400">Created</dt>
          <dd className="mt-0.5 font-semibold text-gray-700">
            {formatDate(project.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-400">Updated</dt>
          <dd className="mt-0.5 font-semibold text-gray-700">
            {formatDate(project.updatedAt)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-400">Products</dt>
          <dd className="mt-0.5 font-semibold text-gray-700">
            {project.summary.productCount}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-400">Est. Revenue</dt>
          <dd className="mt-0.5 font-semibold text-gray-700">
            {formatProjectMoney(project.summary.estimatedRevenue)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="font-medium text-gray-400">Est. GP</dt>
          <dd className="mt-0.5 font-semibold text-primary">
            {formatProjectMoney(project.summary.estimatedGp)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onOpen} className="flex-1">
          <FolderOpen className="h-3.5 w-3.5" />
          Open
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onDuplicate}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof FolderOpen;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium",
        danger
          ? "text-fti-red hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-50",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
