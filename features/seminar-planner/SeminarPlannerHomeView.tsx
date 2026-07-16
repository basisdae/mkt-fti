"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus, Search } from "lucide-react";
import { NewSeminarEventDialog } from "@/components/seminar-planner/NewSeminarEventDialog";
import { SeminarEventCard } from "@/components/seminar-planner/SeminarEventCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/forms/Select";
import { useAuth } from "@/hooks/AuthStore";
import {
  createSeminarEventAction,
  duplicateSeminarEventAction,
  listSeminarEventsAction,
  setSeminarEventArchivedAction,
} from "@/lib/actions/seminar-planner";
import { canEditSeminarPlanner } from "@/lib/auth/permissions";
import { SEMINAR_EVENT_STATUS_LABELS } from "@/lib/seminar-planner-format";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import {
  SEMINAR_EVENT_STATUSES,
  type SeminarEventStatus,
  type SeminarEventSummary,
} from "@/types/seminar-planner";
import { cn } from "@/lib/utils";

type TabKey = "active" | "archived";
type SortKey = "updated" | "title" | "start_date";

const TAB_LABELS: Record<TabKey, string> = {
  active: t.tabActive,
  archived: t.tabArchived,
};

export function SeminarPlannerHomeView() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canEditSeminarPlanner(user);

  const [events, setEvents] = useState<SeminarEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("active");
  const [statusFilter, setStatusFilter] = useState<SeminarEventStatus | "all">(
    "all",
  );
  const [sort, setSort] = useState<SortKey>("updated");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setLoading(true);
    const result = await listSeminarEventsAction({ includeArchived: true });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      setEvents([]);
      return;
    }
    setError(null);
    setEvents(result.data);
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
    const filtered = events.filter((event) => {
      if (tab === "archived") return event.is_archived;
      if (event.is_archived) return false;
      return true;
    });

    const statusFiltered =
      statusFilter === "all"
        ? filtered
        : filtered.filter((event) => event.status === statusFilter);

    const q = query.trim().toLowerCase();
    const searched = q
      ? statusFiltered.filter(
          (event) =>
            event.title.toLowerCase().includes(q) ||
            event.event_type.toLowerCase().includes(q) ||
            event.owner.toLowerCase().includes(q),
        )
      : statusFiltered;

    return [...searched].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "th");
      if (sort === "start_date") {
        const aDate = a.start_date ?? "";
        const bDate = b.start_date ?? "";
        return bDate.localeCompare(aDate);
      }
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [events, query, tab, statusFilter, sort]);

  async function handleCreate(input: { title: string; event_type?: string }) {
    setCreating(true);
    setCreateError(null);
    const result = await createSeminarEventAction({
      values: {
        title: input.title,
        event_type: input.event_type,
      },
    });
    setCreating(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }
    setNewOpen(false);
    router.push(`/seminars/${result.data.id}`);
  }

  async function handleDuplicate(event: SeminarEventSummary) {
    setMenuId(null);
    const result = await duplicateSeminarEventAction(event.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/seminars/${result.data.id}`);
  }

  async function handleArchive(event: SeminarEventSummary, archived: boolean) {
    setMenuId(null);
    const result = await setSeminarEventArchivedAction(event.id, archived);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    void refresh();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t.homeEyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            {t.homeTitle}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{t.homeSubtitle}</p>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/seminars/library")}
            >
              {t.libraryLink}
            </Button>
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" />
              {t.newEvent}
            </Button>
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-gray-200 bg-white p-1">
          {(["active", "archived"] as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                tab === key
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50",
              )}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchEvents}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as SeminarEventStatus | "all")
          }
          className="w-44"
          options={[
            { value: "all", label: t.filterAllStatus },
            ...SEMINAR_EVENT_STATUSES.map((status) => ({
              value: status,
              label: SEMINAR_EVENT_STATUS_LABELS[status],
            })),
          ]}
        />
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="w-40"
          options={[
            { value: "updated", label: t.sortLastUpdated },
            { value: "title", label: t.sortTitle },
            { value: "start_date", label: t.sortStartDate },
          ]}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">{t.loadingEvents}</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-700">
            {t.emptyEvents}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((event) => (
            <SeminarEventCard
              key={event.id}
              event={event}
              canEdit={canEdit}
              menuOpen={menuId === event.id}
              onToggleMenu={() =>
                setMenuId((prev) => (prev === event.id ? null : event.id))
              }
              onOpen={() => router.push(`/seminars/${event.id}`)}
              onDuplicate={() => void handleDuplicate(event)}
              onArchive={() => void handleArchive(event, true)}
              onUnarchive={() => void handleArchive(event, false)}
            />
          ))}
        </div>
      )}

      <NewSeminarEventDialog
        open={newOpen}
        creating={creating}
        error={createError}
        onCancel={() => {
          setNewOpen(false);
          setCreateError(null);
        }}
        onCreate={handleCreate}
      />
    </div>
  );
}
