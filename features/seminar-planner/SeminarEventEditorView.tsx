"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { SeminarAgendaLibraryDropdown } from "@/components/seminar-planner/SeminarAgendaLibraryDropdown";
import { SeminarAgendaExportPreview } from "@/components/seminar-planner/SeminarAgendaExportPreview";
import { SeminarAgendaClearDialog } from "@/components/seminar-planner/SeminarAgendaClearDialog";
import {
  SeminarAgendaReplaceLibraryDialog,
  type SeminarAgendaReplaceLibraryTarget,
} from "@/components/seminar-planner/SeminarAgendaReplaceLibraryDialog";
import { SeminarAgendaSortableList } from "@/components/seminar-planner/SeminarAgendaSortableList";
import { SeminarAgendaSessionSummaryDrawer } from "@/components/seminar-planner/SeminarAgendaSessionSummaryDrawer";
import { SeminarAgendaSummary } from "@/components/seminar-planner/SeminarAgendaSummary";
import { SeminarAgendaWarningsDrawer } from "@/components/seminar-planner/SeminarAgendaWarningsDrawer";
import { SeminarTimeInput } from "@/components/seminar-planner/SeminarTimeInput";
import { SeminarEventStatusBadge } from "@/components/seminar-planner/SeminarEventStatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { useAuth } from "@/hooks/AuthStore";
import {
  clearSeminarAgendaAction,
  getSeminarEventBundleAction,
  saveSeminarAgendaItemsAction,
  saveSeminarEventAction,
} from "@/lib/actions/seminar-planner";
import { restoreAppMainScrollTop, getAppMainScrollTop } from "@/lib/app-scroll";
import {
  listCategoriesAction,
  listFormatsAction,
  listPurposesAction,
  listSessionStatusesAction,
  listTargetGroupsAction,
} from "@/lib/actions/seminar-library";
import { canEditSeminarPlanner } from "@/lib/auth/permissions";
import {
  canEditWithSupabaseAuth,
  reportActionError,
} from "@/lib/auth/supabase-auth-guard-ui";
import { duplicateBullets, normalizeBullets } from "@/lib/seminar-planner-bullets";
import { buildAgendaWarningReport } from "@/lib/seminar-planner-agenda-warnings";
import type {
  AgendaWarningCategory,
  AgendaWarningIssue,
} from "@/lib/seminar-planner-agenda-warnings";
import { newAgendaClientKey } from "@/lib/seminar-planner-agenda-keys";
import {
  needsLibraryReplaceConfirm,
  replaceAgendaItemFromLibrary,
} from "@/lib/seminar-planner-agenda-replace";
import {
  resolveEventAndAgendaDates,
  syncAgendaItemsToEventDate,
} from "@/lib/seminar-planner-agenda-date";
import {
  formatSeminarDateRange,
  formatSeminarClockRange,
  formatSeminarMinutes,
  formatSeminarSessionStatusLabel,
  SEMINAR_EVENT_FORMAT_LABELS,
  SEMINAR_EVENT_STATUS_LABELS,
} from "@/lib/seminar-planner-format";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import {
  SEMINAR_EVENT_FORMATS,
  SEMINAR_EVENT_STATUSES,
  SEMINAR_PLANNER_ERRORS,
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
    agenda_short_detail: row.agenda_short_detail ?? "",
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
    client_key: newAgendaClientKey(),
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
    client_key: newAgendaClientKey(),
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
  const searchParams = useSearchParams();
  const { user, session } = useAuth();
  const canEdit = canEditWithSupabaseAuth(canEditSeminarPlanner(user), session);
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
  const agendaItemsRef = useRef<SeminarAgendaItemInput[]>([]);

  const [savingAgendaOrder, setSavingAgendaOrder] = useState(false);
  const [summaryItemIndex, setSummaryItemIndex] = useState<number | null>(null);
  const [replacingAgendaIndex, setReplacingAgendaIndex] = useState<number | null>(
    null,
  );
  const [replaceConfirmTarget, setReplaceConfirmTarget] =
    useState<SeminarAgendaReplaceLibraryTarget | null>(null);
  const [replaceConfirmSession, setReplaceConfirmSession] =
    useState<SeminarLibSessionRow | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [expandedAgendaKeys, setExpandedAgendaKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [highlightAgendaKey, setHighlightAgendaKey] = useState<string | null>(
    null,
  );
  const highlightTimeoutRef = useRef<number | null>(null);
  const [warningsDrawerOpen, setWarningsDrawerOpen] = useState(false);
  const [warningsFocusCategory, setWarningsFocusCategory] =
    useState<AgendaWarningCategory | null>(null);
  const [clearAgendaDialogOpen, setClearAgendaDialogOpen] = useState(false);
  const [clearingAgenda, setClearingAgenda] = useState(false);
  const [clearAgendaError, setClearAgendaError] = useState<string | null>(null);
  const [agendaExportOpen, setAgendaExportOpen] = useState(false);
  const [categoryColorHints, setCategoryColorHints] = useState<
    Record<string, string>
  >({});

  const [masterOptions, setMasterOptions] = useState<{
    formats: { value: string; label: string }[];
    statuses: { value: string; label: string }[];
    targetGroups: { id: string; name: string }[];
    purposes: { id: string; name: string }[];
    categories: { value: string; label: string }[];
  }>({
    formats: [],
    statuses: [],
    targetGroups: [],
    purposes: [],
    categories: [],
  });

  const applyBundle = useCallback((data: SeminarEventBundle) => {
    const resolved = resolveEventAndAgendaDates(
      data.event.start_date,
      data.agenda_items,
    );
    setBundle(data);
    setEventForm({
      title: data.event.title,
      event_type: data.event.event_type,
      start_date: resolved.eventDate,
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
      [...resolved.agendaItems]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(agendaRowToInput),
    );
    agendaItemsRef.current = [...resolved.agendaItems]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(agendaRowToInput);
    setDirty(false);
  }, []);

  async function loadBundle(options?: { silent?: boolean }) {
    const scrollY = options?.silent ? getAppMainScrollTop() : null;
    if (!options?.silent) {
      setLoading(true);
    }
    const result = await getSeminarEventBundleAction(eventId);
    if (!options?.silent) {
      setLoading(false);
    }
    if (!result.ok) {
      reportActionError(result.error, setError);
      if (!options?.silent) {
        setBundle(null);
      }
      return;
    }
    setError(null);
    applyBundle(result.data);
    if (scrollY != null) {
      restoreAppMainScrollTop(scrollY);
    }
  }

  async function loadMasterData() {
    const [formats, statuses, targetGroups, purposes, categories] =
      await Promise.all([
      listFormatsAction(),
      listSessionStatusesAction(),
      listTargetGroupsAction(),
      listPurposesAction(),
      listCategoriesAction(),
    ]);
    if (
      !formats.ok ||
      !statuses.ok ||
      !targetGroups.ok ||
      !purposes.ok ||
      !categories.ok
    ) {
      return;
    }
    setMasterOptions({
      formats: formats.data
        .filter((f) => f.is_active && !f.is_archived)
        .map((f) => ({ value: f.name, label: f.name })),
      statuses: statuses.data
        .filter((s) => s.is_active && !s.is_archived)
        .map((s) => ({
          value: s.name,
          label: formatSeminarSessionStatusLabel(s.name),
        })),
      targetGroups: targetGroups.data
        .filter((g) => g.is_active && !g.is_archived)
        .map((g) => ({ id: g.id, name: g.name })),
      purposes: purposes.data
        .filter((p) => p.is_active && !p.is_archived)
        .map((p) => ({ id: p.id, name: p.name })),
      categories: categories.data
        .filter((c) => c.is_active && !c.is_archived)
        .map((c) => ({ value: c.name, label: c.name })),
    });
    const hints: Record<string, string> = {};
    for (const category of categories.data) {
      const hint = category.color_hint?.trim();
      if (hint) hints[category.name] = hint;
    }
    setCategoryColorHints(hints);
  }

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (requestedTab === "overview" || requestedTab === "agenda") {
      setTab(requestedTab);
    }
  }, [searchParams]);

  useEffect(() => {
    void loadBundle();
    void loadMasterData();
    return () => {
      if (highlightTimeoutRef.current != null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [eventId]);

  const agendaWarningReport = useMemo(
    () => buildAgendaWarningReport(agendaItems, { dirty: false }),
    [agendaItems],
  );

  const agendaTotals = useMemo(() => {
    const totalMinutes = agendaItems.reduce((sum, item) => {
      const minutes = item.duration_minutes;
      return sum + (typeof minutes === "number" ? minutes : 0);
    }, 0);
    return {
      sessionCount: agendaItems.length,
      totalMinutes,
    };
  }, [agendaItems]);

  const agendaExportEvent = useMemo(() => {
    if (!bundle) return null;
    return {
      title: eventForm.title?.trim() || bundle.event.title,
      start_date: eventForm.start_date ?? bundle.event.start_date,
      end_date: eventForm.end_date ?? bundle.event.end_date,
      venue: eventForm.venue ?? bundle.event.venue,
      event_format: eventForm.event_format ?? bundle.event.event_format,
    };
  }, [bundle, eventForm]);

  const isNotFound = error === SEMINAR_PLANNER_ERRORS.eventNotFound;
  const isPermissionDenied =
    error === SEMINAR_PLANNER_ERRORS.noPermissionView ||
    error === SEMINAR_PLANNER_ERRORS.noPermissionEdit;

  function patchEvent(partial: Partial<SeminarEventInput>) {
    setEventForm((prev) => {
      const next = { ...prev, ...partial };
      if ("start_date" in partial) {
        setAgendaItems((items) =>
          syncAgendaItemsToEventDate(items, next.start_date ?? null),
        );
      }
      return next;
    });
    setDirty(true);
  }

  function toggleId(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function applyAgendaOrder(next: SeminarAgendaItemInput[]) {
    const eventDate = eventForm.start_date ?? null;
    const reordered = next.map((item, index) => ({
      ...item,
      sort_order: index,
      session_date: eventDate,
    }));
    setAgendaItems(reordered);
    agendaItemsRef.current = reordered;
    setDirty(true);
    return reordered;
  }

  async function persistAgendaItems(items?: SeminarAgendaItemInput[]) {
    const payload =
      items ??
      agendaItemsRef.current.map((item, index) => ({
        ...item,
        sort_order: index,
        session_date: eventForm.start_date ?? null,
      }));
    return saveAgendaItemsOnly(payload);
  }

  async function handleAgendaReorder(next: SeminarAgendaItemInput[]) {
    const reordered = applyAgendaOrder(next);
    setSavingAgendaOrder(true);
    setSaveError(null);
    const saved = await persistAgendaItems(reordered);
    setSavingAgendaOrder(false);
    if (!saved) {
      await loadBundle({ silent: true });
    }
  }

  async function handleShortDetailBlur() {
    if (!canEdit) return;
    setSaveError(null);
    const saved = await persistAgendaItems();
    if (!saved) {
      await loadBundle({ silent: true });
    }
  }

  function setAgendaExpanded(sortId: string, expanded: boolean) {
    setExpandedAgendaKeys((prev) => {
      const next = new Set(prev);
      if (expanded) next.add(sortId);
      else next.delete(sortId);
      return next;
    });
  }

  function openWarningsDrawer(category?: AgendaWarningCategory) {
    setWarningsFocusCategory(category ?? null);
    setWarningsDrawerOpen(true);
  }

  function focusAgendaIssue(issue: AgendaWarningIssue) {
    setWarningsDrawerOpen(false);
    setExpandedAgendaKeys((prev) => new Set(prev).add(issue.itemId));
    setHighlightAgendaKey(issue.itemId);
    if (highlightTimeoutRef.current != null) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    window.requestAnimationFrame(() => {
      const el = document.querySelector(`[data-agenda-row="${issue.itemId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightAgendaKey(null);
      highlightTimeoutRef.current = null;
    }, 2500);
  }

  async function handleClearAgendaConfirm() {
    setClearingAgenda(true);
    setClearAgendaError(null);
    const result = await clearSeminarAgendaAction(eventId);
    if (!result.ok) {
      setClearAgendaError(result.error ?? t.clearAgendaFailed);
      setClearingAgenda(false);
      await loadBundle({ silent: true });
      return;
    }
    setClearAgendaDialogOpen(false);
    setClearingAgenda(false);
    setDirty(false);
    setSavedAt(new Date().toISOString());
    setSaveError(null);
    await loadBundle({ silent: true });
  }

  function reorderAgenda(next: SeminarAgendaItemInput[]) {
    applyAgendaOrder(next);
  }

  function updateAgendaItem(index: number, item: SeminarAgendaItemInput) {
    const next = [...agendaItems];
    next[index] = {
      ...item,
      session_date: eventForm.start_date ?? null,
    };
    setAgendaItems(next);
    agendaItemsRef.current = next;
    setDirty(true);
  }

  async function removeAgendaItem(index: number) {
    const item = agendaItems[index];
    if (
      !window.confirm(
        t.removeSessionConfirm(item?.title?.trim() || t.sessionTitle),
      )
    ) {
      return;
    }
    const next = agendaItems.filter((_, i) => i !== index);
    await handleAgendaReorder(next);
  }

  function addFromLibrary(session: SeminarLibSessionRow) {
    reorderAgenda([
      ...agendaItems,
      sessionToAgendaItem(session, agendaItems.length),
    ]);
  }

  function addCustomSession() {
    reorderAgenda([
      ...agendaItems,
      newCustomAgendaItem(agendaItems.length),
    ]);
    setTab("agenda");
  }

  async function saveAgendaItemsOnly(nextItems: SeminarAgendaItemInput[]) {
    const agendaResult = await saveSeminarAgendaItemsAction({
      event_id: eventId,
      items: nextItems,
    });
    if (!agendaResult.ok) {
      setSaveError(agendaResult.error);
      return false;
    }
    await loadBundle({ silent: true });
    setDirty(false);
    setSavedAt(new Date().toISOString());
    return true;
  }

  async function commitReplaceFromLibrary(
    index: number,
    session: SeminarLibSessionRow,
  ) {
    if (!canEdit || replacingAgendaIndex != null) return false;

    const nextItems = replaceAgendaItemFromLibrary(
      agendaItems,
      index,
      session,
      eventForm.start_date ?? null,
    );
    setReplacingAgendaIndex(index);
    setReplaceError(null);
    setAgendaItems(
      nextItems.map((item, itemIndex) => ({ ...item, sort_order: itemIndex })),
    );

    const saved = await saveAgendaItemsOnly(
      nextItems.map((item, itemIndex) => ({ ...item, sort_order: itemIndex })),
    );
    setReplacingAgendaIndex(null);
    if (!saved) {
      await loadBundle({ silent: true });
      return false;
    }
    return true;
  }

  function requestReplaceFromLibrary(
    index: number,
    session: SeminarLibSessionRow,
  ) {
    if (!canEdit || replacingAgendaIndex != null) return;

    const current = agendaItems[index];
    if (!current) return;
    if (current.library_session_id === session.id) return;

    if (needsLibraryReplaceConfirm(current, session)) {
      setReplaceError(null);
      setReplaceConfirmSession(session);
      setReplaceConfirmTarget({
        index,
        fromTitle: current.title,
        toTitle: session.title,
        needsOverwriteWarning: true,
      });
      return;
    }

    void commitReplaceFromLibrary(index, session);
  }

  async function handleReplaceConfirm() {
    if (!replaceConfirmTarget || !replaceConfirmSession) return;
    const { index } = replaceConfirmTarget;
    const session = replaceConfirmSession;
    const ok = await commitReplaceFromLibrary(index, session);
    if (ok) {
      setReplaceConfirmTarget(null);
      setReplaceConfirmSession(null);
      setReplaceError(null);
    } else {
      setReplaceError(t.replaceLibraryFailed);
    }
  }

  function handleReplaceConfirmClose() {
    if (replacingAgendaIndex != null) return;
    setReplaceConfirmTarget(null);
    setReplaceConfirmSession(null);
    setReplaceError(null);
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

      await loadBundle({ silent: tab === "agenda" });
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
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <div
          className={cn(
            "rounded-xl border px-4 py-4",
            isPermissionDenied
              ? "border-amber-100 bg-amber-50 text-amber-900"
              : "border-red-100 bg-red-50 text-fti-red",
          )}
        >
          <h1 className="text-lg font-semibold">
            {isNotFound ? t.eventNotFoundTitle : t.eventDetailHeader}
          </h1>
          <p className="mt-2 text-sm">
            {isNotFound ? t.eventNotFoundBody : error}
          </p>
        </div>
        <Link
          href="/seminars"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {t.backToEventList}
        </Link>
      </div>
    );
  }

  if (!bundle) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
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
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {eventForm.title || t.editorTitle}
              </h1>
              {eventForm.status ? (
                <SeminarEventStatusBadge
                  status={eventForm.status}
                  archived={bundle.event.is_archived}
                />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-gray-500">{t.editorSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => void loadBundle()}>
              <RefreshCw className="h-4 w-4" />
              {t.refresh}
            </Button>
            {canEdit ? (
              <>
                <Button variant="secondary" onClick={() => setTab("overview")}>
                  <Pencil className="h-4 w-4" />
                  {t.editEventData}
                </Button>
                <Button
                  onClick={() => void handleSave()}
                  disabled={saving || !dirty}
                >
                  {saving ? t.saving : t.saveEvent}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            {t.eventDetailHeader}
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-4 lg:grid-cols-8">
            <div>
              <dt className="text-gray-400">{t.status}</dt>
              <dd className="font-medium text-gray-800">
                {eventForm.status
                  ? SEMINAR_EVENT_STATUS_LABELS[eventForm.status]
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">{t.dateRange}</dt>
              <dd className="font-medium text-gray-800">
                {formatSeminarDateRange(
                  eventForm.start_date ?? null,
                  eventForm.end_date ?? null,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">{t.dailyHours}</dt>
              <dd className="font-medium text-gray-800">
                {eventForm.daily_start_time || eventForm.daily_end_time
                  ? formatSeminarClockRange(
                      eventForm.daily_start_time,
                      eventForm.daily_end_time,
                    )
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">{t.venue}</dt>
              <dd className="font-medium text-gray-800">
                {eventForm.venue || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">{t.eventFormat}</dt>
              <dd className="font-medium text-gray-800">
                {eventForm.event_format
                  ? SEMINAR_EVENT_FORMAT_LABELS[eventForm.event_format]
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">{t.sessions}</dt>
              <dd className="font-medium text-gray-800">
                {agendaTotals.sessionCount.toLocaleString("th-TH")}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">{t.totalMinutes}</dt>
              <dd className="font-medium text-gray-800">
                {formatSeminarMinutes(agendaTotals.totalMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">{t.owner}</dt>
              <dd className="font-medium text-gray-800">
                {eventForm.owner || "—"}
              </dd>
            </div>
          </dl>
          {eventForm.team_members?.trim() ? (
            <p className="mt-3 text-xs text-gray-600">
              <span className="text-gray-400">{t.teamMembers}: </span>
              {eventForm.team_members}
            </p>
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
            <SeminarTimeInput
              label={t.dailyStartLabel}
              value={eventForm.daily_start_time}
              onChange={(value) =>
                patchEvent({
                  daily_start_time: value,
                })
              }
              disabled={!canEdit}
            />
            <SeminarTimeInput
              label={t.dailyEndLabel}
              value={eventForm.daily_end_time}
              onChange={(value) =>
                patchEvent({
                  daily_end_time: value,
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
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {t.agendaSection}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {eventForm.start_date ? (
                  <>
                    {t.agendaEventDateLabel}:{" "}
                    <span className="font-medium text-gray-700">
                      {formatSeminarDateRange(
                        eventForm.start_date ?? null,
                        eventForm.end_date ?? null,
                      )}
                    </span>
                    {" · "}
                    {t.agendaEventDateHint}
                  </>
                ) : (
                  t.agendaEventDateMissing
                )}
              </p>
            </div>
            {agendaItems.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAgendaExportOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  {t.agendaDocumentPreview}
                </Button>
                {canEdit ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-fti-red hover:bg-red-50"
                      onClick={() => {
                        setClearAgendaError(null);
                        setClearAgendaDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t.clearAgenda}
                    </Button>
                    <Button variant="secondary" onClick={addCustomSession}>
                      <Plus className="h-4 w-4" />
                      {t.addCustomSession}
                    </Button>
                  </>
                ) : null}
              </div>
            ) : canEdit ? (
              <Button variant="secondary" onClick={addCustomSession}>
                <Plus className="h-4 w-4" />
                {t.addCustomSession}
              </Button>
            ) : null}
          </div>

          {canEdit ? (
            <SeminarAgendaLibraryDropdown
              disabled={!canEdit}
              categoryOptions={masterOptions.categories}
              onSelect={addFromLibrary}
            />
          ) : null}

          <SeminarAgendaSummary
            items={agendaItems}
            warningReport={agendaWarningReport}
            onOpenWarnings={openWarningsDrawer}
          />

          {agendaItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
              <p className="text-sm text-gray-500">{t.agendaEmpty}</p>
            </div>
          ) : (
            <SeminarAgendaSortableList
              items={agendaItems}
              canEdit={canEdit}
              statusOptions={masterOptions.statuses}
              replacingIndex={replacingAgendaIndex}
              savingOrder={savingAgendaOrder}
              expandedKeys={expandedAgendaKeys}
              highlightAgendaKey={highlightAgendaKey}
              onExpandedChange={setAgendaExpanded}
              onReorder={(next) => void handleAgendaReorder(next)}
              onChange={updateAgendaItem}
              onReplaceFromLibrary={(index, session) =>
                requestReplaceFromLibrary(index, session)
              }
              onRemove={(index) => void removeAgendaItem(index)}
              onViewSummary={setSummaryItemIndex}
              onShortDetailBlur={() => void handleShortDetailBlur()}
            />
          )}

          <SeminarAgendaWarningsDrawer
            open={warningsDrawerOpen}
            report={agendaWarningReport}
            focusCategory={warningsFocusCategory}
            onClose={() => {
              setWarningsDrawerOpen(false);
              setWarningsFocusCategory(null);
            }}
            onSelectIssue={focusAgendaIssue}
          />

          <SeminarAgendaClearDialog
            open={clearAgendaDialogOpen}
            sessionCount={agendaItems.length}
            clearing={clearingAgenda}
            error={clearAgendaError}
            onClose={() => {
              if (clearingAgenda) return;
              setClearAgendaDialogOpen(false);
              setClearAgendaError(null);
            }}
            onConfirm={() => void handleClearAgendaConfirm()}
          />

          <SeminarAgendaSessionSummaryDrawer
            open={summaryItemIndex != null}
            item={
              summaryItemIndex != null
                ? agendaItems[summaryItemIndex] ?? null
                : null
            }
            onClose={() => setSummaryItemIndex(null)}
          />

          <SeminarAgendaReplaceLibraryDialog
            target={replaceConfirmTarget}
            replacing={replacingAgendaIndex != null}
            error={replaceError}
            onClose={handleReplaceConfirmClose}
            onConfirm={() => void handleReplaceConfirm()}
          />

          <SeminarAgendaExportPreview
            open={agendaExportOpen}
            event={agendaExportEvent}
            items={agendaItems}
            categoryColorHints={categoryColorHints}
            onClose={() => setAgendaExportOpen(false)}
          />
        </section>
      )}
    </div>
  );
}
