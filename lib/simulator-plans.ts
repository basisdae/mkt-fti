/**
 * Client-side simulator plans / campaigns (localStorage only).
 * Does not touch product database or pricing formulas.
 */
import { generateId } from "@/lib/generate-id";
import type { ScenarioRow } from "@/lib/pricing";
import { sumScenarioRows } from "@/lib/pricing";

export const SIMULATOR_PLANS_KEY = "mkt_hq_simulator_plans";
export const SIMULATOR_DRAFT_KEY = "mkt_hq_simulator_current_draft";

export interface SimulatorPlanSummary {
  productCount: number;
  totalTargetRevenue: number;
  totalRevenue: number;
}

export interface SimulatorPlanNotes {
  campaignObjective: string;
  targetCustomer: string;
  keyAssumptions: string;
  risks: string;
  followUpActions: string;
}

export const EMPTY_SIMULATOR_NOTES: SimulatorPlanNotes = {
  campaignObjective: "",
  targetCustomer: "",
  keyAssumptions: "",
  risks: "",
  followUpActions: "",
};

export interface SimulatorPlanSnapshot {
  productId: string;
  tierId: string;
  targetRevenue: number;
  expectedQty: number;
  scenarioRows: ScenarioRow[];
  notes: SimulatorPlanNotes;
}

export interface SimulatorPlan extends SimulatorPlanSnapshot {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  summary: SimulatorPlanSummary;
}

export interface SimulatorDraft extends SimulatorPlanSnapshot {
  planName: string;
  activePlanId: string | null;
  updatedAt: string;
}

export function buildPlanSummary(
  snapshot: SimulatorPlanSnapshot,
): SimulatorPlanSummary {
  const totals = sumScenarioRows(snapshot.scenarioRows);
  return {
    productCount: snapshot.scenarioRows.length,
    totalTargetRevenue: snapshot.scenarioRows.reduce(
      (sum, row) => sum + (Number(row.targetRevenue) || 0),
      0,
    ),
    totalRevenue: totals.revenue,
  };
}

function canUseStorage(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const probe = "__mkt_hq_sim_probe__";
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

function writeJson(key: string, value: unknown): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function isScenarioRow(value: unknown): value is ScenarioRow {
  if (!value || typeof value !== "object") return false;
  const row = value as ScenarioRow;
  return (
    typeof row.id === "string" &&
    typeof row.productId === "string" &&
    typeof row.productName === "string" &&
    typeof row.qty === "number"
  );
}

function readNoteField(
  notes: Partial<SimulatorPlanNotes> | null | undefined,
  key: keyof SimulatorPlanNotes,
): string {
  const value = notes?.[key];
  return typeof value === "string" ? value : "";
}

function normalizeNotes(
  value: Partial<SimulatorPlanNotes> | null | undefined,
): SimulatorPlanNotes {
  return {
    campaignObjective: readNoteField(value, "campaignObjective"),
    targetCustomer: readNoteField(value, "targetCustomer"),
    keyAssumptions: readNoteField(value, "keyAssumptions"),
    risks: readNoteField(value, "risks"),
    followUpActions: readNoteField(value, "followUpActions"),
  };
}

function normalizeSnapshot(
  value: Partial<SimulatorPlanSnapshot> | null | undefined,
): SimulatorPlanSnapshot {
  const rows = Array.isArray(value?.scenarioRows)
    ? value!.scenarioRows.filter(isScenarioRow)
    : [];
  return {
    productId: typeof value?.productId === "string" ? value.productId : "",
    tierId: typeof value?.tierId === "string" ? value.tierId : "",
    targetRevenue:
      typeof value?.targetRevenue === "number" ? value.targetRevenue : 50_000_000,
    expectedQty:
      typeof value?.expectedQty === "number" ? value.expectedQty : 0,
    scenarioRows: rows,
    notes: normalizeNotes(value?.notes),
  };
}

export function listSimulatorPlans(): SimulatorPlan[] {
  const raw = readJson<unknown>(SIMULATOR_PLANS_KEY);
  if (!Array.isArray(raw)) return [];

  const plans: SimulatorPlan[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<SimulatorPlan>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      continue;
    }
    const snapshot = normalizeSnapshot(record);
    plans.push({
      id: record.id,
      name: record.name,
      createdAt:
        typeof record.createdAt === "string"
          ? record.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof record.updatedAt === "string"
          ? record.updatedAt
          : new Date().toISOString(),
      ...snapshot,
      summary: record.summary ?? buildPlanSummary(snapshot),
    });
  }

  return plans.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function writePlans(plans: SimulatorPlan[]): boolean {
  return writeJson(SIMULATOR_PLANS_KEY, plans);
}

export function loadSimulatorDraft(): SimulatorDraft | null {
  const raw = readJson<Partial<SimulatorDraft>>(SIMULATOR_DRAFT_KEY);
  if (!raw) return null;
  const snapshot = normalizeSnapshot(raw);
  return {
    ...snapshot,
    planName: typeof raw.planName === "string" ? raw.planName : "",
    activePlanId:
      typeof raw.activePlanId === "string" ? raw.activePlanId : null,
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

export function saveSimulatorDraft(draft: SimulatorDraft): boolean {
  return writeJson(SIMULATOR_DRAFT_KEY, {
    ...draft,
    updatedAt: new Date().toISOString(),
  });
}

export function clearSimulatorDraftStorage(): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.removeItem(SIMULATOR_DRAFT_KEY);
    return true;
  } catch {
    return false;
  }
}

export function saveSimulatorPlan(
  name: string,
  snapshot: SimulatorPlanSnapshot,
  existingId?: string | null,
): { plan: SimulatorPlan; ok: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return {
      plan: null as unknown as SimulatorPlan,
      ok: false,
      error: "กรุณาใส่ชื่อแผน / แคมเปญ",
    };
  }

  const plans = listSimulatorPlans();
  const now = new Date().toISOString();
  const summary = buildPlanSummary(snapshot);

  if (existingId) {
    const index = plans.findIndex((plan) => plan.id === existingId);
    if (index >= 0) {
      const updated: SimulatorPlan = {
        ...plans[index]!,
        ...snapshot,
        name: trimmed,
        updatedAt: now,
        summary,
      };
      plans[index] = updated;
      const ok = writePlans(plans);
      return {
        plan: updated,
        ok,
        error: ok ? undefined : "ไม่สามารถบันทึกแผนได้ (localStorage)",
      };
    }
  }

  const created: SimulatorPlan = {
    id: generateId(),
    name: trimmed,
    createdAt: now,
    updatedAt: now,
    ...snapshot,
    summary,
  };
  const ok = writePlans([created, ...plans]);
  return {
    plan: created,
    ok,
    error: ok ? undefined : "ไม่สามารถบันทึกแผนได้ (localStorage)",
  };
}

export function deleteSimulatorPlan(planId: string): boolean {
  const plans = listSimulatorPlans().filter((plan) => plan.id !== planId);
  return writePlans(plans);
}

export function renameSimulatorPlan(
  planId: string,
  name: string,
): { ok: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "กรุณาใส่ชื่อแผน" };
  const plans = listSimulatorPlans();
  const index = plans.findIndex((plan) => plan.id === planId);
  if (index < 0) return { ok: false, error: "ไม่พบแผน" };
  plans[index] = {
    ...plans[index]!,
    name: trimmed,
    updatedAt: new Date().toISOString(),
  };
  const ok = writePlans(plans);
  return {
    ok,
    error: ok ? undefined : "ไม่สามารถเปลี่ยนชื่อได้ (localStorage)",
  };
}

export function duplicateSimulatorPlan(
  planId: string,
): { plan: SimulatorPlan | null; ok: boolean; error?: string } {
  const plans = listSimulatorPlans();
  const source = plans.find((plan) => plan.id === planId);
  if (!source) return { plan: null, ok: false, error: "ไม่พบแผน" };

  const now = new Date().toISOString();
  const copy: SimulatorPlan = {
    ...source,
    id: generateId(),
    name: `${source.name} Copy`,
    createdAt: now,
    updatedAt: now,
    scenarioRows: source.scenarioRows.map((row) => ({
      ...row,
      id: generateId(),
    })),
  };
  const ok = writePlans([copy, ...plans]);
  return {
    plan: copy,
    ok,
    error: ok ? undefined : "ไม่สามารถคัดลอกแผนได้ (localStorage)",
  };
}

export function formatPlanMoney(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
