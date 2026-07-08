export type SupplierLogoDisplayMode = "cover" | "contain";

const STORAGE_KEY = "mkt-fti-supplier-logo-display";

function canUseDom() {
  return typeof window !== "undefined";
}

function loadMap(): Record<string, SupplierLogoDisplayMode> {
  if (!canUseDom()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, SupplierLogoDisplayMode>;
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, SupplierLogoDisplayMode>) {
  if (!canUseDom()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getSupplierLogoDisplayMode(
  supplierId: string | null | undefined,
): SupplierLogoDisplayMode {
  if (!supplierId) return "cover";
  const mode = loadMap()[supplierId];
  return mode === "contain" ? "contain" : "cover";
}

export function setSupplierLogoDisplayMode(
  supplierId: string,
  mode: SupplierLogoDisplayMode,
): void {
  const map = loadMap();
  map[supplierId] = mode;
  saveMap(map);
}
