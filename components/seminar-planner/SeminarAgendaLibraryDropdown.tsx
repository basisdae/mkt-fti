"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Select } from "@/components/forms/Select";
import { listSessionLibraryAction } from "@/lib/actions/seminar-library";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type { SeminarLibSessionRow } from "@/types/seminar-planner";

interface SeminarAgendaLibraryDropdownProps {
  disabled?: boolean;
  categoryOptions: { value: string; label: string }[];
  onSelect: (session: SeminarLibSessionRow) => void;
}

export function SeminarAgendaLibraryDropdown({
  disabled = false,
  categoryOptions,
  onSelect,
}: SeminarAgendaLibraryDropdownProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sessions, setSessions] = useState<SeminarLibSessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickValue, setPickValue] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await listSessionLibraryAction({
        search: query,
        categoryName: category === "all" ? undefined : category,
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
  }, [query, category]);

  const options = useMemo(
    () => [
      { value: "", label: t.pickFromLibrary },
      ...sessions.map((session) => ({
        value: session.id,
        label: `${session.title}${session.category_name ? ` · ${session.category_name}` : ""}`,
      })),
    ],
    [sessions],
  );

  function handlePick(sessionId: string) {
    if (!sessionId) return;
    const session = sessions.find((row) => row.id === sessionId);
    if (!session) return;
    onSelect(session);
    setPickValue("");
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-900">{t.addFromLibrary}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.librarySearch}
            disabled={disabled}
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary disabled:bg-gray-50"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={disabled}
          className="w-44"
          options={[
            { value: "all", label: t.filterAllCategories },
            ...categoryOptions,
          ]}
        />
        <Select
          value={pickValue}
          onChange={(e) => {
            const value = e.target.value;
            setPickValue(value);
            handlePick(value);
          }}
          disabled={disabled || loading || sessions.length === 0}
          className="min-w-[14rem] flex-1"
          options={options}
        />
      </div>
      {loading ? (
        <p className="mt-2 text-xs text-gray-500">{t.loadingLibrary}</p>
      ) : sessions.length === 0 ? (
        <p className="mt-2 text-xs text-gray-500">{t.emptyLibrary}</p>
      ) : (
        <p className="mt-2 text-xs text-gray-500">{t.libraryPickHint}</p>
      )}
    </div>
  );
}
