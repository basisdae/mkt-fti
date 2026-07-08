/**
 * Sales Plan Projects — localStorage only (V1).
 * Completely isolated from Product / Supplier databases and APIs.
 * Does not modify pricing formulas; only reads scenario row totals for display.
 */
import { generateId } from "@/lib/generate-id";
import type { ScenarioRow } from "@/lib/pricing";
import { sumScenarioRows } from "@/lib/pricing";
import {
  EMPTY_SIMULATOR_NOTES,
  SIMULATOR_PLANS_KEY,
  type SimulatorPlan,
  type SimulatorPlanNotes,
  type SimulatorPlanSnapshot,
} from "@/lib/simulator-plans";

export const SALES_PROJECTS_KEY = "mkt_sales_projects";
export const SALES_CURRENT_PROJECT_KEY = "mkt_sales_current_project";
export const SALES_PROJECTS_EVENT = "mkt-hq-sales-projects-changed";

export type SalesPlanProjectStatus = "active" | "archived";

export interface SalesPlanProjectSummary {
  productCount: number;
  estimatedRevenue: number;
  estimatedGp: number;
}

export interface SalesPlanProjectPayload {
  productId: string;
  tierId: string;
  targetRevenue: number;
  expectedQty: number;
  scenarioRows: ScenarioRow[];
  notes: SimulatorPlanNotes;
}

export interface SalesPlanProject extends SalesPlanProjectPayload {
  id: string;
  name: string;
  description: string;
  status: SalesPlanProjectStatus;
  createdAt: string;
  updatedAt: string;
  /** Last explicit Save (or create). Autosave draft uses draft.updatedAt. */
  lastSavedAt: string;
  summary: SalesPlanProjectSummary;
}

export interface SalesPlanProjectDraft extends SalesPlanProjectPayload {
  projectId: string;
  updatedAt: string;
}

export type SalesProjectSort = "updated" | "name" | "created";

const DEFAULT_TARGET = 50_000_000;
let migratedLegacy = false;

function canUseStorage(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const probe = "__mkt_sales_projects_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(
  key: string,
  value: unknown,
  options?: { notify?: boolean },
): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    if (options?.notify !== false && key === SALES_PROJECTS_KEY) {
      window.dispatchEvent(new Event(SALES_PROJECTS_EVENT));
    }
    return true;
  } catch {
    return false;
  }
}

function isScenarioRow(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as ScenarioRow;
  return (
    typeof row.id === "string" &&
    typeof row.productId === "string" &&
    typeof row.productName === "string" &&
    typeof row.qty === "number"
  );
}

function normalizeNotes(
  value: Partial<SimulatorPlanNotes> | null | undefined,
): SimulatorPlanNotes {
  return {
    campaignObjective:
      typeof value?.campaignObjective === "string"
        ? value.campaignObjective
        : "",
    targetCustomer:
      typeof value?.targetCustomer === "string" ? value.targetCustomer : "",
    keyAssumptions:
      typeof value?.keyAssumptions === "string" ? value.keyAssumptions : "",
    risks: typeof value?.risks === "string" ? value.risks : "",
    followUpActions:
      typeof value?.followUpActions === "string" ? value.followUpActions : "",
  };
}

function normalizePayload(
  value: Partial<SalesPlanProjectPayload> | null | undefined,
): SalesPlanProjectPayload {
  const rows = Array.isArray(value?.scenarioRows)
    ? value!.scenarioRows.filter(isScenarioRow)
    : [];
  return {
    productId: typeof value?.productId === "string" ? value.productId : "",
    tierId: typeof value?.tierId === "string" ? value.tierId : "",
    targetRevenue:
      typeof value?.targetRevenue === "number"
        ? value.targetRevenue
        : DEFAULT_TARGET,
    expectedQty:
      typeof value?.expectedQty === "number" ? value.expectedQty : 0,
    scenarioRows: rows as ScenarioRow[],
    notes: normalizeNotes(value?.notes),
  };
}

export function buildProjectSummary(
  payload: SalesPlanProjectPayload,
): SalesPlanProjectSummary {
  const totals = sumScenarioRows(payload.scenarioRows);
  return {
    productCount: payload.scenarioRows.length,
    estimatedRevenue: totals.revenue,
    estimatedGp: totals.grossProfit,
  };
}

function normalizeProject(
  value: Partial<SalesPlanProject> & { id: string; name: string },
): SalesPlanProject {
  const payload = normalizePayload(value);
  const createdAt =
    typeof value.createdAt === "string"
      ? value.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof value.updatedAt === "string" ? value.updatedAt : createdAt;
  const lastSavedAt =
    typeof value.lastSavedAt === "string" ? value.lastSavedAt : updatedAt;
  return {
    id: value.id,
    name: value.name,
    description:
      typeof value.description === "string" ? value.description : "",
    status: value.status === "archived" ? "archived" : "active",
    createdAt,
    updatedAt,
    lastSavedAt,
    ...payload,
    summary: value.summary ?? buildProjectSummary(payload),
  };
}

function readProjectsRawUnchecked(): SalesPlanProject[] {
  const raw = readJson<unknown>(SALES_PROJECTS_KEY);
  if (!Array.isArray(raw)) return [];
  const projects: SalesPlanProject[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<SalesPlanProject>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      continue;
    }
    projects.push(normalizeProject(record as SalesPlanProject));
  }
  return projects;
}

function readProjectsRaw(): SalesPlanProject[] {
  migrateLegacyPlansIfNeeded();
  return readProjectsRawUnchecked();
}

function writeProjects(projects: SalesPlanProject[]): boolean {
  return writeJson(SALES_PROJECTS_KEY, projects);
}

/** One-time import from legacy simulator plans key (local only). */
function migrateLegacyPlansIfNeeded(): void {
  if (migratedLegacy || !canUseStorage()) return;
  migratedLegacy = true;

  const existing = readProjectsRawUnchecked();
  if (existing.length > 0) return;

  const legacy = readJson<unknown>(SIMULATOR_PLANS_KEY);
  if (!Array.isArray(legacy) || legacy.length === 0) return;

  const imported: SalesPlanProject[] = [];
  for (const item of legacy) {
    if (!item || typeof item !== "object") continue;
    const plan = item as Partial<SimulatorPlan>;
    if (typeof plan.id !== "string" || typeof plan.name !== "string") continue;
    const payload = normalizePayload(plan);
    const createdAt =
      typeof plan.createdAt === "string"
        ? plan.createdAt
        : new Date().toISOString();
    const updatedAt =
      typeof plan.updatedAt === "string" ? plan.updatedAt : createdAt;
    imported.push({
      id: plan.id,
      name: plan.name,
      description: "",
      status: "active",
      createdAt,
      updatedAt,
      lastSavedAt: updatedAt,
      ...payload,
      summary: buildProjectSummary(payload),
    });
  }

  if (imported.length > 0) {
    writeProjects(imported);
  }
}

export function listSalesProjects(options?: {
  includeArchived?: boolean;
}): SalesPlanProject[] {
  let projects = readProjectsRaw();
  if (!options?.includeArchived) {
    projects = projects.filter((project) => project.status === "active");
  }
  return projects.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getSalesProject(id: string): SalesPlanProject | null {
  return readProjectsRaw().find((project) => project.id === id) ?? null;
}

export function createSalesProject(input: {
  name: string;
  description?: string;
}): { project: SalesPlanProject | null; ok: boolean; error?: string } {
  const name = input.name.trim();
  if (!name) {
    return { project: null, ok: false, error: "Project name is required." };
  }

  const now = new Date().toISOString();
  const payload = normalizePayload({
    notes: EMPTY_SIMULATOR_NOTES,
  });
  const project: SalesPlanProject = {
    id: generateId(),
    name,
    description: (input.description ?? "").trim(),
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastSavedAt: now,
    ...payload,
    summary: buildProjectSummary(payload),
  };

  const projects = readProjectsRaw();
  const ok = writeProjects([project, ...projects]);
  return {
    project: ok ? project : null,
    ok,
    error: ok ? undefined : "Could not create project (localStorage).",
  };
}

export function saveSalesProject(
  projectId: string,
  payload: SalesPlanProjectPayload,
  options?: { name?: string; description?: string },
): { project: SalesPlanProject | null; ok: boolean; error?: string } {
  const projects = readProjectsRaw();
  const index = projects.findIndex((project) => project.id === projectId);
  if (index < 0) {
    return { project: null, ok: false, error: "Project not found." };
  }

  const now = new Date().toISOString();
  const nextPayload = normalizePayload(payload);
  const current = projects[index]!;
  const updated: SalesPlanProject = {
    ...current,
    ...nextPayload,
    name:
      typeof options?.name === "string" && options.name.trim()
        ? options.name.trim()
        : current.name,
    description:
      typeof options?.description === "string"
        ? options.description.trim()
        : current.description,
    updatedAt: now,
    lastSavedAt: now,
    summary: buildProjectSummary(nextPayload),
  };
  projects[index] = updated;
  const ok = writeProjects(projects);
  if (ok) {
    const draft = loadSalesProjectDraft();
    if (draft?.projectId === projectId) {
      clearSalesProjectDraft();
    }
  }
  return {
    project: ok ? updated : null,
    ok,
    error: ok ? undefined : "Could not save project (localStorage).",
  };
}

export function renameSalesProject(
  projectId: string,
  name: string,
): { ok: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Project name is required." };
  const projects = readProjectsRaw();
  const index = projects.findIndex((project) => project.id === projectId);
  if (index < 0) return { ok: false, error: "Project not found." };
  projects[index] = {
    ...projects[index]!,
    name: trimmed,
    updatedAt: new Date().toISOString(),
  };
  const ok = writeProjects(projects);
  return {
    ok,
    error: ok ? undefined : "Could not rename project (localStorage).",
  };
}

export function duplicateSalesProject(
  projectId: string,
): { project: SalesPlanProject | null; ok: boolean; error?: string } {
  const source = getSalesProject(projectId);
  if (!source) return { project: null, ok: false, error: "Project not found." };

  const now = new Date().toISOString();
  const copy: SalesPlanProject = {
    ...source,
    id: generateId(),
    name: `${source.name} (Copy)`,
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastSavedAt: now,
    scenarioRows: source.scenarioRows.map((row) => ({
      ...row,
      id: generateId(),
    })),
  };
  const others = readProjectsRaw().filter((project) => project.id !== copy.id);
  const ok = writeProjects([copy, ...others]);
  return {
    project: ok ? copy : null,
    ok,
    error: ok ? undefined : "Could not duplicate project (localStorage).",
  };
}

export function archiveSalesProject(projectId: string): boolean {
  const projects = readProjectsRaw();
  const index = projects.findIndex((project) => project.id === projectId);
  if (index < 0) return false;
  projects[index] = {
    ...projects[index]!,
    status: "archived",
    updatedAt: new Date().toISOString(),
  };
  return writeProjects(projects);
}

export function unarchiveSalesProject(projectId: string): boolean {
  const projects = readProjectsRaw();
  const index = projects.findIndex((project) => project.id === projectId);
  if (index < 0) return false;
  projects[index] = {
    ...projects[index]!,
    status: "active",
    updatedAt: new Date().toISOString(),
  };
  return writeProjects(projects);
}

/**
 * Deletes ONLY the local Sales Plan Project entry.
 * Never touches Product or Supplier data.
 */
export function deleteSalesProject(projectId: string): boolean {
  const projects = readProjectsRaw().filter(
    (project) => project.id !== projectId,
  );
  const ok = writeProjects(projects);
  if (ok) {
    const draft = loadSalesProjectDraft();
    if (draft?.projectId === projectId) {
      clearSalesProjectDraft();
    }
  }
  return ok;
}

export function loadSalesProjectDraft(): SalesPlanProjectDraft | null {
  const raw = readJson<Partial<SalesPlanProjectDraft>>(
    SALES_CURRENT_PROJECT_KEY,
  );
  if (!raw || typeof raw.projectId !== "string") return null;
  const payload = normalizePayload(raw);
  return {
    projectId: raw.projectId,
    ...payload,
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

export function saveSalesProjectDraft(
  draft: SalesPlanProjectDraft,
): boolean {
  return writeJson(
    SALES_CURRENT_PROJECT_KEY,
    {
      ...normalizePayload(draft),
      projectId: draft.projectId,
      updatedAt: new Date().toISOString(),
    },
    { notify: false },
  );
}

export function clearSalesProjectDraft(): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.removeItem(SALES_CURRENT_PROJECT_KEY);
    return true;
  } catch {
    return false;
  }
}

export function filterAndSortProjects(
  projects: SalesPlanProject[],
  options: {
    query: string;
    sort: SalesProjectSort;
    showArchived: boolean;
  },
): SalesPlanProject[] {
  const q = options.query.trim().toLowerCase();
  let list = projects.filter((project) =>
    options.showArchived
      ? project.status === "archived"
      : project.status === "active",
  );

  if (q) {
    list = list.filter(
      (project) =>
        project.name.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q),
    );
  }

  list = [...list].sort((a, b) => {
    if (options.sort === "name") {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    if (options.sort === "created") {
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return list;
}

export function formatProjectMoney(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatLastSavedLabel(iso: string | null | undefined): string {
  if (!iso) return "Not saved yet";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not saved yet";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Last saved just now";
  if (minutes === 1) return "Last saved 1 minute ago";
  if (minutes < 60) return `Last saved ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Last saved 1 hour ago";
  if (hours < 24) return `Last saved ${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Last saved 1 day ago";
  return `Last saved ${days} days ago`;
}

export function projectToSimulatorPlan(
  project: SalesPlanProject,
): SimulatorPlan {
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    productId: project.productId,
    tierId: project.tierId,
    targetRevenue: project.targetRevenue,
    expectedQty: project.expectedQty,
    scenarioRows: project.scenarioRows,
    notes: project.notes,
    summary: {
      productCount: project.summary.productCount,
      totalTargetRevenue: project.scenarioRows.reduce(
        (sum, row) => sum + (Number(row.targetRevenue) || 0),
        0,
      ),
      totalRevenue: project.summary.estimatedRevenue,
    },
  };
}

export function projectPayloadFromSnapshot(
  snapshot: SimulatorPlanSnapshot,
): SalesPlanProjectPayload {
  return normalizePayload(snapshot);
}

export function emptyProjectPayload(): SalesPlanProjectPayload {
  return normalizePayload({ notes: EMPTY_SIMULATOR_NOTES });
}
