"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "mkt-fti:product-form-sections";

function readSectionState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSectionState(next: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

interface PimCollapsibleSectionProps {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function PimCollapsibleSection({
  id,
  title,
  description,
  defaultOpen = true,
  children,
  className,
}: PimCollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const stored = readSectionState();
    if (typeof stored[id] === "boolean") {
      setOpen(stored[id]!);
    }
  }, [id]);

  function toggle() {
    setOpen((prev) => {
      const nextOpen = !prev;
      const stored = readSectionState();
      writeSectionState({ ...stored, [id]: nextOpen });
      return nextOpen;
    });
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm shadow-gray-200/40",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50/80"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-gray-400">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 py-4">{children}</div>
      )}
    </section>
  );
}
