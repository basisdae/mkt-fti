"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { SeminarLibrarySessionDialog } from "@/components/seminar-planner/SeminarLibrarySessionDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { useAuth } from "@/hooks/AuthStore";
import {
  deleteCategoryAction,
  deleteFormatAction,
  deletePurposeAction,
  deleteSessionLibraryAction,
  deleteSessionStatusAction,
  deleteSpeakerAction,
  deleteTargetGroupAction,
  listCategoriesAction,
  listFormatsAction,
  listPurposesAction,
  listSessionLibraryAction,
  listSessionStatusesAction,
  listSpeakersAction,
  listTargetGroupsAction,
  saveCategoryAction,
  saveFormatAction,
  savePurposeAction,
  saveSessionLibraryAction,
  saveSessionStatusAction,
  saveSpeakerAction,
  saveTargetGroupAction,
  setCategoryArchivedAction,
  setFormatArchivedAction,
  setPurposeArchivedAction,
  setSessionLibraryArchivedAction,
  setSessionStatusArchivedAction,
  setSpeakerArchivedAction,
  setTargetGroupArchivedAction,
} from "@/lib/actions/seminar-library";
import { canEditSeminarPlanner } from "@/lib/auth/permissions";
import { formatSeminarMinutes } from "@/lib/seminar-planner-format";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type {
  SeminarLibCategoryInput,
  SeminarLibCategoryRow,
  SeminarLibSessionInput,
  SeminarLibSessionRow,
  SeminarLibSimpleMasterInput,
  SeminarLibSimpleMasterRow,
  SeminarLibSpeakerInput,
  SeminarLibSpeakerRow,
} from "@/types/seminar-planner";
import { cn, formatDate } from "@/lib/utils";

type LibraryTab =
  | "sessions"
  | "categories"
  | "formats"
  | "target_groups"
  | "purposes"
  | "speakers"
  | "statuses";

type SimpleMasterTab = Exclude<LibraryTab, "sessions">;

interface SeminarLibraryBundle {
  sessions: SeminarLibSessionRow[];
  categories: SeminarLibCategoryRow[];
  formats: SeminarLibSimpleMasterRow[];
  target_groups: SeminarLibSimpleMasterRow[];
  purposes: SeminarLibSimpleMasterRow[];
  speakers: SeminarLibSpeakerRow[];
  statuses: SeminarLibSimpleMasterRow[];
}

const TAB_LABELS: Record<LibraryTab, string> = {
  sessions: t.tabSessions,
  categories: t.tabCategories,
  formats: t.tabFormats,
  target_groups: t.tabTargetGroups,
  purposes: t.tabPurposes,
  speakers: t.tabSpeakers,
  statuses: t.tabStatuses,
};

const SIMPLE_TABS: SimpleMasterTab[] = [
  "categories",
  "formats",
  "target_groups",
  "purposes",
  "speakers",
  "statuses",
];

export function SeminarLibraryView() {
  const { user } = useAuth();
  const canEdit = canEditSeminarPlanner(user);
  const savingRef = useRef(false);

  const [bundle, setBundle] = useState<SeminarLibraryBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<LibraryTab>("sessions");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SeminarLibSessionRow | null>(
    null,
  );

  const [simpleDialogOpen, setSimpleDialogOpen] = useState(false);
  const [editingSimple, setEditingSimple] = useState<
    | { tab: SimpleMasterTab; row: SeminarLibSimpleMasterRow | SeminarLibCategoryRow | SeminarLibSpeakerRow }
    | null
  >(null);
  const [simpleValues, setSimpleValues] = useState({
    name: "",
    description: "",
    role_hint: "",
    color_hint: "",
    is_active: true,
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    const [
      sessions,
      categories,
      formats,
      target_groups,
      purposes,
      speakers,
      statuses,
    ] = await Promise.all([
      listSessionLibraryAction({ includeArchived: true }),
      listCategoriesAction({ includeArchived: true }),
      listFormatsAction({ includeArchived: true }),
      listTargetGroupsAction({ includeArchived: true }),
      listPurposesAction({ includeArchived: true }),
      listSpeakersAction({ includeArchived: true }),
      listSessionStatusesAction({ includeArchived: true }),
    ]);
    setLoading(false);

    const results = [
      sessions,
      categories,
      formats,
      target_groups,
      purposes,
      speakers,
      statuses,
    ];
    const failed = results.find((r) => !r.ok);
    if (failed && !failed.ok) {
      setError(failed.error);
      setBundle(null);
      return;
    }
    if (
      !sessions.ok ||
      !categories.ok ||
      !formats.ok ||
      !target_groups.ok ||
      !purposes.ok ||
      !speakers.ok ||
      !statuses.ok
    ) {
      return;
    }

    setError(null);
    setBundle({
      sessions: sessions.data,
      categories: categories.data,
      formats: formats.data,
      target_groups: target_groups.data,
      purposes: purposes.data,
      speakers: speakers.data,
      statuses: statuses.data,
    });
  }

  useEffect(() => {
    void refresh();
  }, []);

  const rows = useMemo(() => {
    if (!bundle) return [];
    const q = query.trim().toLowerCase();

    function filterArchived<T extends { is_archived: boolean; name?: string; title?: string }>(
      items: T[],
    ): T[] {
      let list = showArchived ? items : items.filter((i) => !i.is_archived);
      if (!q) return list;
      return list.filter((item) => {
        const name = ("title" in item ? item.title : item.name) ?? "";
        return String(name).toLowerCase().includes(q);
      });
    }

    switch (tab) {
      case "sessions":
        return filterArchived(bundle.sessions);
      case "categories":
        return filterArchived(bundle.categories);
      case "formats":
        return filterArchived(bundle.formats);
      case "target_groups":
        return filterArchived(bundle.target_groups);
      case "purposes":
        return filterArchived(bundle.purposes);
      case "speakers":
        return filterArchived(bundle.speakers);
      case "statuses":
        return filterArchived(bundle.statuses);
      default:
        return [];
    }
  }, [bundle, tab, query, showArchived]);

  function openNewSession() {
    setEditingSession(null);
    setSessionDialogOpen(true);
    setSaveError(null);
  }

  function openEditSession(row: SeminarLibSessionRow) {
    setEditingSession(row);
    setSessionDialogOpen(true);
    setSaveError(null);
  }

  function openNewSimple(currentTab: SimpleMasterTab) {
    setEditingSimple(null);
    setTab(currentTab);
    setSimpleValues({
      name: "",
      description: "",
      role_hint: "",
      color_hint: "",
      is_active: true,
    });
    setSimpleDialogOpen(true);
    setSaveError(null);
  }

  function openEditSimple(
    currentTab: SimpleMasterTab,
    row: SeminarLibSimpleMasterRow | SeminarLibCategoryRow | SeminarLibSpeakerRow,
  ) {
    setEditingSimple({ tab: currentTab, row });
    setSimpleValues({
      name: "name" in row ? row.name : "",
      description: "description" in row ? row.description : "",
      role_hint: "role_hint" in row ? row.role_hint : "",
      color_hint: "color_hint" in row ? row.color_hint : "",
      is_active: row.is_active,
    });
    setSimpleDialogOpen(true);
    setSaveError(null);
  }

  async function handleSaveSession(values: SeminarLibSessionInput) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveSessionLibraryAction({
        id: editingSession?.id,
        values,
      });
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      setSessionDialogOpen(false);
      await refresh();
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  async function handleSaveSimple() {
    if (savingRef.current || !SIMPLE_TABS.includes(tab as SimpleMasterTab)) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);

    const currentTab = tab as SimpleMasterTab;
    const id = editingSimple?.row.id;

    try {
      let result;
      if (currentTab === "categories") {
        const input: SeminarLibCategoryInput = {
          name: simpleValues.name.trim(),
          description: simpleValues.description,
          color_hint: simpleValues.color_hint,
          is_active: simpleValues.is_active,
        };
        result = await saveCategoryAction({ id, values: input });
      } else if (currentTab === "speakers") {
        const input: SeminarLibSpeakerInput = {
          name: simpleValues.name.trim(),
          role_hint: simpleValues.role_hint,
          is_active: simpleValues.is_active,
        };
        result = await saveSpeakerAction({ id, values: input });
      } else {
        const input: SeminarLibSimpleMasterInput = {
          name: simpleValues.name.trim(),
          description: simpleValues.description,
          is_active: simpleValues.is_active,
        };
        if (currentTab === "formats") {
          result = await saveFormatAction({ id, values: input });
        } else if (currentTab === "target_groups") {
          result = await saveTargetGroupAction({ id, values: input });
        } else if (currentTab === "purposes") {
          result = await savePurposeAction({ id, values: input });
        } else {
          result = await saveSessionStatusAction({ id, values: input });
        }
      }

      if (!result?.ok) {
        setSaveError(result.error);
        return;
      }
      setSimpleDialogOpen(false);
      await refresh();
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  async function handleArchive(
    table: LibraryTab,
    id: string,
    archived: boolean,
  ) {
    let result;
    switch (table) {
      case "sessions":
        result = await setSessionLibraryArchivedAction(id, archived);
        break;
      case "categories":
        result = await setCategoryArchivedAction(id, archived);
        break;
      case "formats":
        result = await setFormatArchivedAction(id, archived);
        break;
      case "target_groups":
        result = await setTargetGroupArchivedAction(id, archived);
        break;
      case "purposes":
        result = await setPurposeArchivedAction(id, archived);
        break;
      case "speakers":
        result = await setSpeakerArchivedAction(id, archived);
        break;
      case "statuses":
        result = await setSessionStatusArchivedAction(id, archived);
        break;
      default:
        return;
    }
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  async function handleDelete(table: LibraryTab, id: string) {
    let result;
    switch (table) {
      case "sessions":
        result = await deleteSessionLibraryAction(id);
        break;
      case "categories":
        result = await deleteCategoryAction(id);
        break;
      case "formats":
        result = await deleteFormatAction(id);
        break;
      case "target_groups":
        result = await deleteTargetGroupAction(id);
        break;
      case "purposes":
        result = await deletePurposeAction(id);
        break;
      case "speakers":
        result = await deleteSpeakerAction(id);
        break;
      case "statuses":
        result = await deleteSessionStatusAction(id);
        break;
      default:
        return;
    }
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/seminars"
            className="text-sm text-primary hover:underline"
          >
            {t.backToSeminars}
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
            {t.libraryEyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            {t.libraryTitle}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {t.librarySubtitle}
          </p>
        </div>
        {canEdit ? (
          <Button
            onClick={() =>
              tab === "sessions" ? openNewSession() : openNewSimple(tab as SimpleMasterTab)
            }
          >
            <Plus className="h-4 w-4" />
            {t.addItem}
          </Button>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as LibraryTab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setQuery("");
            }}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
              tab === key
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            )}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchLibrary}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          {t.showArchived}
        </label>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">{t.loadingLibrary}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-700">{t.emptyLibrary}</p>
        </div>
      ) : tab === "sessions" ? (
        <div className="grid gap-3">
          {(rows as SeminarLibSessionRow[]).map((session) => (
            <article
              key={session.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {session.title}
                  </h3>
                  {session.is_archived ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      {t.archived}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {session.category_name || "—"}
                  {session.recommended_minutes != null
                    ? ` · ${formatSeminarMinutes(session.recommended_minutes)}`
                    : ""}
                  {session.recommended_speaker
                    ? ` · ${session.recommended_speaker}`
                    : ""}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {t.updated} {formatDate(session.updated_at)}
                </p>
              </div>
              {canEdit ? (
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditSession(session)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t.editItem}
                  </Button>
                  {session.is_archived ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void handleArchive("sessions", session.id, false)
                      }
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                      {t.restore}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void handleArchive("sessions", session.id, true)
                      }
                    >
                      <Archive className="h-3.5 w-3.5" />
                      {t.archive}
                    </Button>
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {(
            rows as (
              | SeminarLibSimpleMasterRow
              | SeminarLibCategoryRow
              | SeminarLibSpeakerRow
            )[]
          ).map((row) => (
            <article
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {row.name}
                  </h3>
                  {row.is_archived ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      {t.archived}
                    </span>
                  ) : !row.is_active ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      inactive
                    </span>
                  ) : null}
                </div>
                {"description" in row && row.description ? (
                  <p className="mt-1 text-xs text-gray-500">{row.description}</p>
                ) : null}
                {"role_hint" in row && row.role_hint ? (
                  <p className="mt-1 text-xs text-gray-500">{row.role_hint}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-gray-400">
                  {t.updated} {formatDate(row.updated_at)}
                </p>
              </div>
              {canEdit ? (
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      openEditSimple(tab as SimpleMasterTab, row)
                    }
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t.editItem}
                  </Button>
                  {row.is_archived ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void handleArchive(tab, row.id, false)
                      }
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                      {t.restore}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          void handleArchive(tab, row.id, true)
                        }
                      >
                        <Archive className="h-3.5 w-3.5" />
                        {t.archive}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-fti-red hover:bg-red-50"
                        onClick={() => void handleDelete(tab, row.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t.deleteItem}
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <SeminarLibrarySessionDialog
        open={sessionDialogOpen}
        initial={editingSession}
        saving={saving}
        error={saveError}
        onCancel={() => {
          setSessionDialogOpen(false);
          setSaveError(null);
        }}
        onSave={handleSaveSession}
      />

      {simpleDialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSimpleDialogOpen(false)}
        >
          <form
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              void handleSaveSimple();
            }}
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {editingSimple ? t.editItem : t.addItem} — {TAB_LABELS[tab]}
            </h2>
            <div className="mt-4 space-y-3">
              <Input
                label={t.nameLabel}
                value={simpleValues.name}
                onChange={(e) =>
                  setSimpleValues((v) => ({ ...v, name: e.target.value }))
                }
                required
              />
              {tab !== "speakers" ? (
                <Textarea
                  label={t.descriptionLabel}
                  value={simpleValues.description}
                  onChange={(e) =>
                    setSimpleValues((v) => ({
                      ...v,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              ) : (
                <Input
                  label={t.roleHintLabel}
                  value={simpleValues.role_hint}
                  onChange={(e) =>
                    setSimpleValues((v) => ({
                      ...v,
                      role_hint: e.target.value,
                    }))
                  }
                />
              )}
              {tab === "categories" ? (
                <Input
                  label={t.colorHintLabel}
                  value={simpleValues.color_hint}
                  onChange={(e) =>
                    setSimpleValues((v) => ({
                      ...v,
                      color_hint: e.target.value,
                    }))
                  }
                />
              ) : null}
              <Select
                label={t.status}
                value={simpleValues.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  setSimpleValues((v) => ({
                    ...v,
                    is_active: e.target.value === "active",
                  }))
                }
                options={[
                  { value: "active", label: t.active },
                  { value: "inactive", label: "ไม่ใช้งาน" },
                ]}
              />
              {saveError ? (
                <p className="text-xs text-fti-red">{saveError}</p>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSimpleDialogOpen(false)}
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                disabled={saving || !simpleValues.name.trim()}
              >
                {saving ? t.saving : t.save}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
