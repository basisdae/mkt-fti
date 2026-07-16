"use client";

import {
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  formatGiftMoney,
  formatGiftPercent,
  GIFT_PLAN_STATUS_LABELS,
} from "@/lib/gift-plan-format";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import type { GiftPlanListSummary } from "@/types/gift-plan";
import { cn, formatDate } from "@/lib/utils";

interface GiftPlanCardProps {
  plan: GiftPlanListSummary;
  canEdit: boolean;
  canExport: boolean;
  showCosts: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpen: () => void;
  onEditBasics: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onExport: () => void;
}

export function GiftPlanCard({
  plan,
  canEdit,
  canExport,
  showCosts,
  menuOpen,
  onToggleMenu,
  onOpen,
  onEditBasics,
  onDuplicate,
  onRename,
  onArchive,
  onUnarchive,
  onDelete,
  onExport,
}: GiftPlanCardProps) {
  const archived = plan.is_archived;
  const draft = plan.status === "draft" && !archived;
  const statusLabel = archived
    ? t.statusArchived
    : GIFT_PLAN_STATUS_LABELS[plan.status];

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-200/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
              {plan.name}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                archived
                  ? "bg-gray-100 text-gray-500"
                  : draft
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700",
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {plan.campaign_year}
            {plan.owner ? ` · ${plan.owner}` : ""}
          </p>
        </div>

        {(canEdit || canExport) && (
          <div
            className="relative shrink-0"
            data-gift-plan-menu
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onToggleMenu}
              aria-label={t.planActions}
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {menuOpen ? (
              <div
                className="absolute right-0 top-9 z-20 min-w-[10rem] rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
                onClick={(event) => event.stopPropagation()}
              >
                {canExport ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={onExport}
                  >
                    <Download className="h-4 w-4" /> {t.export}
                  </button>
                ) : null}
                {canEdit ? (
                  <>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      onClick={onDuplicate}
                    >
                      <Copy className="h-4 w-4" /> {t.duplicate}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={onRename}
                    >
                      <Pencil className="h-4 w-4" /> {t.rename}
                    </button>
                    {archived ? (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        onClick={onUnarchive}
                      >
                        <ArchiveRestore className="h-4 w-4" /> {t.restore}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        onClick={onArchive}
                      >
                        <Archive className="h-4 w-4" /> {t.archive}
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fti-red hover:bg-red-50"
                      onClick={() => onDelete()}
                    >
                      <Trash2 className="h-4 w-4" /> {t.delete}
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-gray-400">{t.customers}</dt>
          <dd className="font-medium text-gray-800">
            {plan.total_customers.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-gray-400">{t.giftUnits}</dt>
          <dd className="font-medium text-gray-800">
            {plan.total_gift_units.toLocaleString()}
          </dd>
        </div>
        {showCosts ? (
          <>
            <div>
              <dt className="text-gray-400">{t.actualCost}</dt>
              <dd className="font-medium text-gray-800">
                {formatGiftMoney(plan.total_actual_cost)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">{t.estValue}</dt>
              <dd className="font-medium text-gray-800">
                {formatGiftMoney(plan.total_estimated_value)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-400">{t.budgetPercent}</dt>
              <dd className="font-medium text-gray-800">
                {formatGiftPercent(plan.budget_percent)}
              </dd>
            </div>
          </>
        ) : (
          <div className="col-span-2">
            <dt className="text-gray-400">{t.estValue}</dt>
            <dd className="font-medium text-gray-800">
              {formatGiftMoney(plan.total_estimated_value)}
            </dd>
          </div>
        )}
      </dl>

      <p className="mt-3 text-[11px] text-gray-400">
        {t.updated} {formatDate(plan.updated_at)}
      </p>

      <div className="mt-4 flex flex-col gap-2 border-t border-gray-50 pt-4 sm:flex-row">
        <Button type="button" className="w-full min-w-0 sm:flex-1" onClick={onOpen}>
          {t.openPlan}
        </Button>
        {canEdit ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full min-w-0 sm:flex-1"
            onClick={onEditBasics}
          >
            {t.editPlanBasics}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
