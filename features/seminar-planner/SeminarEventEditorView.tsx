"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, RefreshCw, Search } from "lucide-react";
import { SeminarAgendaSessionCard } from "@/components/seminar-planner/SeminarAgendaSessionCard";
import { SeminarAgendaSummary } from "@/components/seminar-planner/SeminarAgendaSummary";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { useAuth } from "@/hooks/AuthStore";
import {
  getSeminarEventBundleAction,
  saveSeminarAgendaItemsAction,
  saveSeminarEventAction,
} from "@/lib/actions/seminar-planner";
import {
  listFormatsAction,
  listPurposesAction,
  listSessionLibraryAction,
  listSessionStatusesAction,
  listTargetGroupsAction,
} from "@/lib/actions/seminar-library";
import { canEditSeminarPlanner } from "@/lib/auth/permissions";
import { duplicateBullets, normalizeBullets } from "@/lib/seminar-planner-bullets";
import { validateAgendaItems } from "@/lib/seminar-planner-agenda-warnings";
import {
  SEMINAR_EVENT_FORMAT_LABELS,
  SEMINAR_EVENT_STATUS_LABELS,
} from "@/lib/seminar-planner-format";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import {
  SEMINAR_EVENT_FORMATS,
  SEMINAR_EVENT_STATUSES,
  type SeminarAgendaItemInput,
  type SeminarAgendaItemRow,
  type SeminarEventBundle,
  type SeminarEventFormat,
  type SeminarEventInput,
  type SeminarEventStatus,
  type SeminarLibSessionRow,
} from "@/types/seminar-planner";
import { cn } from "@/lib/utils";

type EditorTab = "overview" | "agenda";

interface SeminarEventEditorViewProps {
  eventId: string;
}

function agendaRowToInput(row: SeminarAgendaItemRow): SeminarAgendaItemInput {
  return {
    id: row.id,
    library_session_id: row.library_session_id,
    sort_order: row.sort_order,
    title: row.title,
    category_name: row.category_name,
    format_name: row.format_name,
    session_date: row.session_date,
    start_time: row.start_time,
    end_time: row.end_time,
    duration_minutes: row.duration_minutes,
    primary_speaker: row.primary_speaker,
    co_speakers: row.co_speakers,
    detail_bullets: normalizeBullets(row.detail_bullets),
    objectives_bullets: normalizeBullets(row.objectives_bullets),
    outcomes_bullets: normalizeBullets(row.outcomes_bullets),
    target_group_names: row.target_group_names,
    team_notes: row.team_notes,
    owner_name: row.owner_name,
    status_name: row.status_name,
    is_parallel: row.is_parallel,
  };
}

function sessionToAgendaItem(
  session: SeminarLibSessionRow,
  sortOrder: number,
): SeminarAgendaItemInput {
  return {
    library_session_id: session.id,
    sort_order: sortOrder,
    title: session.title,
    category_name: session.category_name,
    format_name: session.recommended_format,
    duration_minutes: session.recommended_minutes,
    primary_speaker: session.recommended_speaker,
    detail_bullets: duplicateBullets(normalizeBullets(session.detail_bullets)),
    objectives_bullets: duplicateBullets(
      normalizeBullets(session.objectives_bullets),
    ),
    outcomes_bullets: duplicateBullets(
      normalizeBullets(session.outcomes_bullets),
    ),
    target_group_names: [...session.target_group_names],
    is_parallel: false,
  };
}

function newCustomAgendaItem(sortOrder: number): SeminarAgendaItemInput {
  return {
    sort_order: sortOrder,
    title: "",
    category_name: "",
    format_name: "",
    detail_bullets: [],
    objectives_bullets: [],
    outcomes_bullets: [],
    target_group_names: [],
    is_parallel: false,
  };
}

export function SeminarEventEditorView({ eventId }: SeminarEventEditorViewProps) {
  const { user } = useAuth();
  const canEdit = canEditSeminarPlanner(user);
  const savingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<SeminarEventBundle | null>(null);
  const [tab, setTab] = useState<EditorTab>("overview");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState<SeminarEventInput>({ title: "" });
  const [targetGroupIds, setTargetGroupIds] = useState<string[]>([]);
  const [purposeIds, setPurposeIds] = useState<string[]>([]);
  const [agendaItems, setAgendaItems] = useState<SeminarAgendaItemInput[]>([]);

  const [librarySessions, setLibrarySessions] = useState<SeminarLibSessionRow[]>(
    [],
  );
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [dragAgendaIndex, setDragAgendaIndex] = useState<number | null>(null);

  const [masterOptions, setMasterOptions] = useState<{
    formats: { value: string; label: string }[];
    statuses: { value: string; label: string }[];
    targetGroups: { id: string; name: string }[];
    purposes: { id: string; name: string }[];
  }>({
    formats: [],
    statuses: [],
    targetGroups: [],
    purposes: [],
  });

  const applyBundle = useCallback((data: SeminarEventBundle) => {
    setBundle(data);
    setEventForm({
      title: data.event.title,
      event_type: data.event.event_type,
      start_date: data.event.start_date,
      end_date: data.event.end_date,
      daily_start_time: data.event.daily_start_time,
      daily_end_time: data.event.daily_end_time,
      venue: data.event.venue,
      event_format: data.event.event_format,
      estimated_attendees: data.event.estimated_attendees,
      owner: data.event.owner,
      team_members: data.event.team_members,
      status: data.event.status,
      notes: data.event.notes,
    });
    setTargetGroupIds(data.target_group_ids);
    setPurposeIds(data.purpose_ids);
    setAgendaItems(
      [...data.agenda_items]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(agendaRowToInput),
    );
    setDirty(false);
  }, []);

  async function loadBundle() {
    setLoading(true);
    const result = await getSeminarEventBundleAction(eventId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      setBundle(null);
      return;
    }
    setError(null);
    applyBundle(result.data);
  }

  async function loadMasterData() {
    const [formats, statuses, targetGroups, purposes] = await Promise.all([
      listFormatsAction(),
      listSessionStatusesAction(),
      listTargetGroupsAction(),
      listPurposesAction(),
    ]);
    if (
      !formats.ok ||
      !statuses.ok ||
      !targetGroups.ok ||
      !purposes.ok
    ) {
      return;
    }
    setMasterOptions({
      formats: formats.data
        .filter((f) => f.is_active && !f.is_archived)
        .map((f) => ({ value: f.name, label: f.name })),
      statuses: statuses.data
        .filter((s) => s.is_active && !s.is_archived)
        .map((s) => ({ value: s.name, label: s.name })),
      targetGroups: targetGroups.data
        .filter((g) => g.is_active && !g.is_archived)
        .map((g) => ({ id: g.id, name: g.name })),
      purposes: purposes.data
        .filter((p) => p.is_active && !p.is_archived)
        .map((p) => ({ id: p.id, name: p.name })),
    });
  }

  useEffect(() => {
    void loadBundle();
    void loadMasterData();
  }, [eventId]);

  async function searchLibrary(q: string) {
    setLibraryLoading(true);
    const result = await listSessionLibraryAction({
      search: q,
      activeOnly: true,
    });
    setLibraryLoading(false);
    if (!result.ok) return;
    setLibrarySessions(result.data);
  }

  useEffect(() => {
    if (!showLibrary) return;
    void searchLibrary(libraryQuery);
  }, [showLibrary, libraryQuery]);

  const agendaWarnings = useMemo(
    () => validateAgendaItems(agendaItems, { dirty }),
    [agendaItems, dirty],
  );

  function patchEvent(partial: Partial<SeminarEventInput>) {
    setEventForm((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  }

  function toggleId(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function reorderAgenda(next: SeminarAgendaItemInput[]) {
    setAgendaItems(
      next.map((item, index) => ({ ...item, sort_order: index })),
    );
    setDirty(true);
  }

  function updateAgendaItem(index: number, item: SeminarAgendaItemInput) {
    const next = [...agendaItems];
    next[index] = item;
    reorderAgenda(next);
  }

  function moveAgenda(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= agendaItems.length) return;
    const next = [...agendaItems];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    reorderAgenda(next);
  }

  function dropAgendaItem(targetIndex: number) {
    if (dragAgendaIndex == null || dragAgendaIndex === targetIndex) {
      setDragAgendaIndex(null);
      return;
    }
    const next = [...agendaItems];
    const [removed] = next.splice(dragAgendaIndex, 1);
    next.splice(targetIndex, 0, removed);
    reorderAgenda(next);
    setDragAgendaIndex(null);
  }

  function duplicateAgendaItem(index: number) {
    const source = agendaItems[index];
    const copy: SeminarAgendaItemInput = {
      ...source,
      id: undefined,
      title: `${source.title}${source.title ? " (สำเนา)" : ""}`,
      detail_bullets: duplicateBullets(source.detail_bullets ?? []),
      objectives_bullets: duplicateBullets(source.objectives_bullets ?? []),
      outcomes_bullets: duplicateBullets(source.outcomes_bullets ?? []),
    };
    const next = [...agendaItems];
    next.splice(index + 1, 0, copy);
    reorderAgenda(next);
  }

  function removeAgendaItem(index: number) {
    reorderAgenda(agendaItems.filter((_, i) => i !== index));
  }

  function addFromLibrary(session: SeminarLibSessionRow) {
    reorderAgenda([
      ...agendaItems,
      sessionToAgendaItem(session, agendaItems.length),
    ]);
    setShowLibrary(false);
  }

  function addCustomSession() {
    reorderAgenda([
      ...agendaItems,
      newCustomAgendaItem(agendaItems.length),
    ]);
    setTab("agenda");
  }

  async function handleSave() {
    if (!canEdit || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);

    try {
      const eventResult = await saveSeminarEventAction({
        id: eventId,
        values: {
          ...eventForm,
          target_group_ids: targetGroupIds,
          purpose_ids: purposeIds,
        },
      });
      if (!eventResult.ok) {
        setSaveError(eventResult.error);
        return;
      }

      const agendaResult = await saveSeminarAgendaItemsAction({
        event_id: eventId,
        items: agendaItems,
      });
      if (!agendaResult.ok) {
        setSaveError(agendaResult.error);
        return;
      }

      await loadBundle();
      setDirty(false);
      setSavedAt(new Date().toISOString());
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">{t.loadingEvent}</div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {error}
        </div>
      </div>
    );
  }

  if (!bundle) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/seminars"
            className="text-sm text-primary hover:underline"
          >
            {t.backToEvents}
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
            {t.editorEyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            {eventForm.title || t.editorTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t.editorSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => void loadBundle()}>
            <RefreshCw className="h-4 w-4" />
            {t.refresh}
          </Button>
          {canEdit ? (
            <Button onClick={() => void handleSave()} disabled={saving || !dirty}>
              {saving ? t.saving : t.saveEvent}
            </Button>
          ) : null}
        </div>
      </header>

      {saveError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {saveError}
        </div>
      ) : null}

      {dirty ? (
        <p className="text-sm text-amber-700">{t.unsavedChanges}</p>
      ) : savedAt ? (
        <p className="text-sm text-emerald-700">{t.saved}</p>
      ) : null}

      <div className="flex rounded-xl border border-gray-200 bg-white p-1 w-fit">
        {(["overview", "agenda"] as EditorTab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              tab === key
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            {key === "overview" ? t.tabOverview : t.tabAgenda}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            {t.overviewSection}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label={t.titleLabel}
              value={eventForm.title ?? ""}
              onChange={(e) => patchEvent({ title: e.target.value })}
              disabled={!canEdit}
              required
            />
            <Input
              label={t.eventType}
              value={eventForm.event_type ?? ""}
              onChange={(e) => patchEvent({ event_type: e.target.value })}
              disabled={!canEdit}
            />
            <Select
              label={t.status}
              value={eventForm.status ?? "idea"}
              onChange={(e) =>
                patchEvent({ status: e.target.value as SeminarEventStatus })
              }
              disabled={!canEdit}
              options={SEMINAR_EVENT_STATUSES.map((status) => ({
                value: status,
                label: SEMINAR_EVENT_STATUS_LABELS[status],
              }))}
            />
            <Select
              label={t.eventFormat}
              value={eventForm.event_format ?? "on_site"}
              onChange={(e) =>
                patchEvent({
                  event_format: e.target.value as SeminarEventFormat,
                })
              }
              disabled={!canEdit}
              options={SEMINAR_EVENT_FORMATS.map((format) => ({
                value: format,
                label: SEMINAR_EVENT_FORMAT_LABELS[format],
              }))}
            />
            <Input
              label={t.startDateLabel}
              type="date"
              value={eventForm.start_date ?? ""}
              onChange={(e) =>
                patchEvent({ start_date: e.target.value || null })
              }
              disabled={!canEdit}
            />
            <Input
              label={t.endDateLabel}
              type="date"
              value={eventForm.end_date ?? ""}
              onChange={(e) =>
                patchEvent({ end_date: e.target.value || null })
              }
              disabled={!canEdit}
            />
            <Input
              label={t.dailyStartLabel}
              type="time"
              value={eventForm.daily_start_time?.slice(0, 5) ?? ""}
              onChange={(e) =>
                patchEvent({
                  daily_start_time: e.target.value || null,
                })
              }
              disabled={!canEdit}
            />
            <Input
              label={t.dailyEndLabel}
              type="time"
              value={eventForm.daily_end_time?.slice(0, 5) ?? ""}
              onChange={(e) =>
                patchEvent({
                  daily_end_time: e.target.value || null,
                })
              }
              disabled={!canEdit}
            />
            <Input
              label={t.venue}
              value={eventForm.venue ?? ""}
              onChange={(e) => patchEvent({ venue: e.target.value })}
              disabled={!canEdit}
              placeholder={t.venuePlaceholder}
            />
            <Input
              label={t.estimatedAttendees}
              type="number"
              min={0}
              value={eventForm.estimated_attendees ?? ""}
              onChange={(e) =>
                patchEvent({
                  estimated_attendees: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              disabled={!canEdit}
            />
            <Input
              label={t.owner}
              value={eventForm.owner ?? ""}
              onChange={(e) => patchEvent({ owner: e.target.value })}
              disabled={!canEdit}
            />
            <div className="md:col-span-2">
              <Textarea
                label={t.teamMembers}
                value={eventForm.team_members ?? ""}
                onChange={(e) => patchEvent({ team_members: e.target.value })}
                disabled={!canEdit}
                placeholder={t.teamMembersPlaceholder}
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label={t.notes}
                value={eventForm.notes ?? ""}
                onChange={(e) => patchEvent({ notes: e.target.value })}
                disabled={!canEdit}
                rows={3}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t.targetGroups}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {masterOptions.targetGroups.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    {t.noTargetGroupsSelected}
                  </p>
                ) : (
                  masterOptions.targetGroups.map((group) => (
                    <label
                      key={group.id}
                      className={cn(
                        "cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                        targetGroupIds.includes(group.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={targetGroupIds.includes(group.id)}
                        disabled={!canEdit}
                        onChange={() => {
                          setTargetGroupIds((prev) => toggleId(prev, group.id));
                          setDirty(true);
                        }}
                      />
                      {group.name}
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{t.purposes}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {masterOptions.purposes.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    {t.noPurposesSelected}
                  </p>
                ) : (
                  masterOptions.purposes.map((purpose) => (
                    <label
                      key={purpose.id}
                      className={cn(
                        "cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                        purposeIds.includes(purpose.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={purposeIds.includes(purpose.id)}
                        disabled={!canEdit}
                        onChange={() => {
                          setPurposeIds((prev) => toggleId(prev, purpose.id));
                          setDirty(true);
                        }}
                      />
                      {purpose.name}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {t.agendaSection}
            </h2>
            {canEdit ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowLibrary((v) => !v)}
                >
                  <BookOpen className="h-4 w-4" />
                  {t.addFromLibrary}
                </Button>
                <Button onClick={addCustomSession}>
                  <Plus className="h-4 w-4" />
                  {t.addCustomSession}
                </Button>
              </div>
            ) : null}
          </div>

          <SeminarAgendaSummary items={agendaItems} />

          {agendaWarnings.length > 0 ? (
            <ul className="space-y-1">
              {agendaWarnings.map((warning) => (
                <li
                  key={warning.id}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs",
                    warning.severity === "error"
                      ? "bg-red-50 text-fti-red"
                      : warning.severity === "warning"
                        ? "bg-amber-50 text-amber-800"
                        : "bg-blue-50 text-blue-700",
                  )}
                >
                  {warning.message}
                </li>
              ))}
            </ul>
          ) : null}

          {showLibrary ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder={t.librarySearch}
                  className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
              {libraryLoading ? (
                <p className="mt-3 text-sm text-gray-500">{t.loadingLibrary}</p>
              ) : librarySessions.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">{t.emptyLibrary}</p>
              ) : (
                <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                  {librarySessions.map((session) => (
                    <li key={session.id}>
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 text-left hover:border-primary/30 hover:bg-primary/5"
                        onClick={() => addFromLibrary(session)}
                        disabled={!canEdit}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {session.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.category_name || "—"}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 shrink-0 text-primary" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {agendaItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
              <p className="text-sm text-gray-500">{t.agendaEmpty}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agendaItems.map((item, index) => (
                <div
                  key={item.id ?? `new-${index}`}
                  draggable={canEdit}
                  onDragStart={() => setDragAgendaIndex(index)}
                  onDragEnd={() => setDragAgendaIndex(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropAgendaItem(index);
                  }}
                  className={cn(
                    dragAgendaIndex === index && "opacity-60 ring-2 ring-primary/30",
                  )}
                >
                  <SeminarAgendaSessionCard
                    item={item}
                    index={index}
                    total={agendaItems.length}
                    allItems={agendaItems}
                    formatOptions={masterOptions.formats}
                    statusOptions={masterOptions.statuses}
                    disabled={!canEdit}
                    onChange={(next) => updateAgendaItem(index, next)}
                    onMoveUp={() => moveAgenda(index, -1)}
                    onMoveDown={() => moveAgenda(index, 1)}
                    onDuplicate={() => duplicateAgendaItem(index)}
                    onRemove={() => removeAgendaItem(index)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
