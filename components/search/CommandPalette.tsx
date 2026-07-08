"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileSpreadsheet,
  Film,
  Package,
  Search,
  SearchX,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { useSupplierStore } from "@/hooks/SupplierStore";
import {
  groupCommandResults,
  loadRecentCommands,
  pushRecentCommand,
  searchCommandPalette,
  type CommandCategory,
  type CommandResult,
} from "@/lib/command-palette";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_ICON: Record<CommandCategory, typeof Package> = {
  Products: Package,
  Suppliers: Building2,
  Factories: Building2,
  "Sales Plans": FileSpreadsheet,
  "Simulator Plans": FileSpreadsheet,
  Certificates: ShieldCheck,
  Media: Film,
  Settings: Settings,
};

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const products = useLiveProducts();
  const { suppliers } = useSupplierStore();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<CommandResult[]>([]);

  const results = useMemo(
    () => searchCommandPalette(query, products, suppliers),
    [query, products, suppliers],
  );
  const groups = useMemo(() => groupCommandResults(results), [results]);
  const flatResults = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );

  const showingRecent = !query.trim();
  const list = showingRecent ? recent : flatResults;

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    setRecent(loadRecentCommands());
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) =>
          list.length === 0 ? 0 : (prev + 1) % list.length,
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) =>
          list.length === 0
            ? 0
            : (prev - 1 + list.length) % list.length,
        );
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const item = list[activeIndex];
        if (item) selectItem(item);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, list, activeIndex, onClose]);

  function selectItem(item: CommandResult) {
    pushRecentCommand(item);
    onClose();
    router.push(item.href);
  }

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 p-3 pt-[10vh] backdrop-blur-[2px] sm:p-4 sm:pt-[12vh]"
      style={{ animation: "cmdPaletteFade 160ms ease-out" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/20"
        style={{ animation: "cmdPalettePop 180ms ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, suppliers, plans, settings…"
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          <kbd className="hidden rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 sm:inline">
            Esc
          </kbd>
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto py-2">
          {showingRecent && recent.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Search className="h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">
                Search MKT HQ
              </p>
              <p className="text-xs text-gray-400">
                Products, suppliers, factories, plans, certificates, media, and
                settings
              </p>
            </div>
          )}

          {showingRecent && recent.length > 0 && (
            <section>
              <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Recent
              </p>
              <ul>
                {recent.map((item, index) => {
                  const Icon = CATEGORY_ICON[item.category] ?? Search;
                  return (
                    <ResultRow
                      key={item.id}
                      item={item}
                      icon={Icon}
                      active={index === activeIndex}
                      onSelect={() => selectItem(item)}
                      onHover={() => setActiveIndex(index)}
                    />
                  );
                })}
              </ul>
            </section>
          )}

          {!showingRecent && list.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <SearchX className="h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">No results</p>
              <p className="text-xs text-gray-400">
                Try another name, SKU, supplier, or setting
              </p>
            </div>
          )}

          {!showingRecent &&
            groups.map((group) => (
              <section key={group.category} className="mb-1">
                <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {group.category}
                </p>
                <ul>
                  {group.items.map((item) => {
                    runningIndex += 1;
                    const index = runningIndex;
                    const Icon = CATEGORY_ICON[item.category] ?? Search;
                    return (
                      <ResultRow
                        key={item.id}
                        item={item}
                        icon={Icon}
                        active={index === activeIndex}
                        onSelect={() => selectItem(item)}
                        onHover={() => setActiveIndex(index)}
                      />
                    );
                  })}
                </ul>
              </section>
            ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400">
          <span>
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1">↑</kbd>{" "}
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1">↓</kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1">Enter</kbd>{" "}
            open
          </span>
          <span>
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1">Esc</kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  item,
  icon: Icon,
  active,
  onSelect,
  onHover,
}: {
  item: CommandResult;
  icon: typeof Package;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={onHover}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
          active ? "bg-primary/10" : "hover:bg-gray-50",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            active ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-500",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-900">
            {item.title}
          </span>
          {item.subtitle && (
            <span className="block truncate text-xs text-gray-500">
              {item.subtitle}
            </span>
          )}
        </span>
        <span className="hidden shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-400 sm:inline">
          {item.category}
        </span>
      </button>
    </li>
  );
}
