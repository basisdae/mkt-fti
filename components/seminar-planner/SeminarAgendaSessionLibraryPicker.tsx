"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { listSessionLibraryAction } from "@/lib/actions/seminar-library";
import { formatSeminarMinutes } from "@/lib/seminar-planner-format";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type { SeminarLibSessionRow } from "@/types/seminar-planner";
import { cn } from "@/lib/utils";

interface SeminarAgendaSessionLibraryPickerProps {
  currentSessionId?: string | null;
  currentTitle?: string;
  currentCategory?: string;
  currentMinutes?: number | null;
  disabled?: boolean;
  busy?: boolean;
  onSelect: (session: SeminarLibSessionRow) => void;
}

function sessionOptionLabel(session: SeminarLibSessionRow): string {
  const parts = [session.title];
  if (session.category_name?.trim()) {
    parts.push(session.category_name.trim());
  }
  parts.push(formatSeminarMinutes(session.recommended_minutes ?? 0));
  if (session.recommended_speaker?.trim()) {
    parts.push(session.recommended_speaker.trim());
  }
  return parts.join(" · ");
}

export function SeminarAgendaSessionLibraryPicker({
  currentSessionId,
  currentTitle = "",
  currentCategory = "",
  currentMinutes = null,
  disabled = false,
  busy = false,
  onSelect,
}: SeminarAgendaSessionLibraryPickerProps) {
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState<SeminarLibSessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await listSessionLibraryAction({
        search: query,
        activeOnly: true,
      });
      if (cancelled) return;
      setLoading(false);
      if (result.ok) setSessions(result.data);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const currentLabel = useMemo(() => {
    if (currentTitle.trim()) {
      const parts = [currentTitle.trim()];
      if (currentCategory.trim()) parts.push(currentCategory.trim());
      if (currentMinutes != null) {
        parts.push(formatSeminarMinutes(currentMinutes));
      }
      return parts.join(" · ");
    }

    if (currentSessionId) {
      const match = sessions.find((row) => row.id === currentSessionId);
      if (match) return sessionOptionLabel(match);
      return t.replaceFromLibraryCurrent;
    }

    return t.replaceFromLibraryEmpty;
  }, [currentTitle, currentCategory, currentMinutes, currentSessionId, sessions]);

  function handlePick(session: SeminarLibSessionRow) {
    if (disabled || busy) return;
    if (session.id === currentSessionId) return;
    onSelect(session);
    setOpen(false);
    setQuery("");
  }

  function stopDrag(event: React.PointerEvent | React.MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div
      ref={containerRef}
      className="relative sm:col-span-2 lg:col-span-4"
      onPointerDown={stopDrag}
      onClick={stopDrag}
    >
      <label className="block text-[11px] font-medium text-gray-600">
        {t.replaceFromLibrary}
      </label>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "mt-1 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left text-xs",
          "outline-none focus:border-primary disabled:bg-gray-50",
        )}
      >
        <span className="truncate text-gray-800">{currentLabel}</span>
        <span className="shrink-0 text-[10px] text-gray-400">
          {busy ? t.replacingSession : t.replaceFromLibraryAction}
        </span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.librarySearch}
              autoFocus
              className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-primary"
            />
          </div>
          <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto">
            {loading ? (
              <li className="px-2 py-2 text-xs text-gray-500">{t.loadingLibrary}</li>
            ) : sessions.length === 0 ? (
              <li className="px-2 py-2 text-xs text-gray-500">{t.emptyLibrary}</li>
            ) : (
              sessions.map((session) => (
                <li key={session.id}>
                  <button
                    type="button"
                    disabled={session.id === currentSessionId}
                    onClick={() => handlePick(session)}
                    className={cn(
                      "w-full rounded-lg px-2 py-2 text-left hover:bg-primary/5",
                      session.id === currentSessionId && "bg-gray-50 opacity-60",
                    )}
                  >
                    <p className="truncate text-xs font-medium text-gray-900">
                      {session.title}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-gray-500">
                      {sessionOptionLabel(session)}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
