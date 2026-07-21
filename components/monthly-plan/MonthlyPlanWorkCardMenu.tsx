"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Calendar,
  Check,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  formatMonthlyPlanMovedToMonth,
  MONTHLY_PLAN_COPY as t,
} from "@/lib/monthly-plan-i18n";
import { cn } from "@/lib/utils";

interface MonthlyPlanWorkCardMenuProps {
  currentMonth: number | null;
  canEdit: boolean;
  canDelete: boolean;
  onSelectMonth: (month: number | null) => void;
  onDeleteRequest: () => void;
  onBlockPointer: (event: ReactPointerEvent<HTMLElement>) => void;
}

export function MonthlyPlanWorkCardMenu({
  currentMonth,
  canEdit,
  canDelete,
  onSelectMonth,
  onDeleteRequest,
  onBlockPointer,
}: MonthlyPlanWorkCardMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen && !monthPickerOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        setMonthPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen, monthPickerOpen]);

  if (!canEdit && !canDelete) return null;

  function handleMonthSelect(month: number | null) {
    if (month === currentMonth) {
      setMonthPickerOpen(false);
      setMenuOpen(false);
      return;
    }
    onSelectMonth(month);
    setMonthPickerOpen(false);
    setMenuOpen(false);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        title={t.cardActions}
        aria-label={t.cardActions}
        aria-expanded={menuOpen}
        onPointerDown={onBlockPointer}
        onClick={(event) => {
          event.stopPropagation();
          setMenuOpen((open) => !open);
          setMonthPickerOpen(false);
        }}
        className={cn(
          "rounded p-0.5 text-gray-400 transition-opacity",
          "opacity-70 hover:bg-gray-100 hover:text-gray-700",
          "focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-primary/30",
          "sm:opacity-0 sm:group-hover/card:opacity-100 sm:group-focus-within/card:opacity-100",
        )}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          {canEdit ? (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  setMonthPickerOpen(true);
                }}
              >
                <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                {currentMonth == null ? t.setMonth : t.moveToMonth}
              </button>
              {currentMonth != null ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleMonthSelect(null);
                  }}
                >
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  {t.removeFromPlan}
                </button>
              ) : null}
            </>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-fti-red hover:bg-red-50"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen(false);
                onDeleteRequest();
              }}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              {t.deleteWork}
            </button>
          ) : null}
        </div>
      ) : null}

      {monthPickerOpen ? (
        <div className="absolute right-0 top-full z-40 mt-1 max-h-56 w-44 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
            onClick={(event) => {
              event.stopPropagation();
              handleMonthSelect(null);
            }}
          >
            <span>{t.filterUnplanned}</span>
            {currentMonth == null ? (
              <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
            ) : null}
          </button>
          {t.months.map((label, index) => {
            const month = index + 1;
            const selected = currentMonth === month;
            return (
              <button
                key={month}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                onClick={(event) => {
                  event.stopPropagation();
                  handleMonthSelect(month);
                }}
              >
                <span>{label}</span>
                {selected ? (
                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function monthMoveToastMessage(month: number | null): string {
  if (month == null) return t.movedToUnplanned;
  return formatMonthlyPlanMovedToMonth(month);
}
