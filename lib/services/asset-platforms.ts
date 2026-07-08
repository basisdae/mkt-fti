import {
  DEFAULT_ASSET_PLATFORMS,
  isAssetPlatformColorToken,
  isAssetPlatformIconKey,
  type AssetPlatform,
} from "@/lib/asset-platforms";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const LOCAL_STORAGE_KEY = "mkt-fti-asset-platforms";

function canUseDom() {
  return typeof window !== "undefined";
}

function mapRow(row: Record<string, unknown>): AssetPlatform {
  const iconKey = String(row.icon_key ?? "link");
  const colorToken = String(row.color_token ?? "gray");
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    iconKey: isAssetPlatformIconKey(iconKey) ? iconKey : "link",
    colorToken: isAssetPlatformColorToken(colorToken) ? colorToken : "gray",
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order) || 0,
  };
}

function toRow(platform: AssetPlatform): Record<string, unknown> {
  return {
    id: platform.id,
    name: platform.name.trim(),
    icon_key: platform.iconKey,
    color_token: platform.colorToken,
    is_active: platform.isActive,
    sort_order: platform.sortOrder,
    updated_at: new Date().toISOString(),
  };
}

function loadLocal(): AssetPlatform[] | null {
  if (!canUseDom()) return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map((item) => mapRow(item as Record<string, unknown>));
  } catch {
    return null;
  }
}

function saveLocal(platforms: AssetPlatform[]) {
  if (!canUseDom()) return;
  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify(platforms.map(toRow)),
  );
}

async function loadFromSupabase(): Promise<AssetPlatform[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("asset_platforms")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) return null;
    if (!data?.length) return [];
    return data.map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    return null;
  }
}

async function saveToSupabase(platforms: AssetPlatform[]): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("asset_platforms")
      .delete()
      .gte("sort_order", -1);
    if (deleteError) return false;
    if (platforms.length === 0) return true;
    const { error } = await supabase
      .from("asset_platforms")
      .insert(platforms.map(toRow));
    return !error;
  } catch {
    return false;
  }
}

/** Ensure defaults exist in Supabase when table is empty. */
async function ensureDefaultsInSupabase(): Promise<AssetPlatform[]> {
  const existing = await loadFromSupabase();
  if (existing === null) return DEFAULT_ASSET_PLATFORMS.map((p) => ({ ...p }));
  if (existing.length > 0) return existing;
  await saveToSupabase(DEFAULT_ASSET_PLATFORMS);
  return DEFAULT_ASSET_PLATFORMS.map((p) => ({ ...p }));
}

export async function loadAssetPlatforms(): Promise<AssetPlatform[]> {
  const remote = await ensureDefaultsInSupabase();
  if (remote.length > 0 && isSupabaseConfigured()) {
    saveLocal(remote);
    return remote;
  }

  const local = loadLocal();
  if (local?.length) return local;

  const defaults = DEFAULT_ASSET_PLATFORMS.map((p) => ({ ...p }));
  saveLocal(defaults);
  return defaults;
}

export async function saveAssetPlatforms(
  platforms: AssetPlatform[],
): Promise<AssetPlatform[]> {
  const normalized = platforms
    .map((platform, index) => ({
      ...platform,
      name: platform.name.trim() || platform.id,
      sortOrder: index,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Always keep Other present.
  if (!normalized.some((platform) => platform.id === "other")) {
    normalized.push({
      id: "other",
      name: "Other",
      iconKey: "link",
      colorToken: "gray",
      isActive: true,
      sortOrder: normalized.length,
    });
  }

  saveLocal(normalized);
  await saveToSupabase(normalized);
  return normalized;
}
