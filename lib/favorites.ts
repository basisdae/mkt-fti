/**
 * Favorites (star) — localStorage only. Does not touch product/supplier DB.
 */
export const FAVORITES_STORAGE_KEY = "mkt_hq_favorites";
export const FAVORITES_CHANGED_EVENT = "mkt-hq-favorites-changed";

export type FavoriteEntityType = "product" | "supplier";

export interface FavoritesState {
  products: string[];
  suppliers: string[];
}

const EMPTY: FavoritesState = { products: [], suppliers: [] };

function canUseStorage(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const probe = "__mkt_hq_fav_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readFavorites(): FavoritesState {
  if (!canUseStorage()) return { ...EMPTY, products: [], suppliers: [] };
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return { products: [], suppliers: [] };
    const parsed = JSON.parse(raw) as Partial<FavoritesState>;
    return {
      products: Array.isArray(parsed.products)
        ? parsed.products.filter((id) => typeof id === "string")
        : [],
      suppliers: Array.isArray(parsed.suppliers)
        ? parsed.suppliers.filter((id) => typeof id === "string")
        : [],
    };
  } catch {
    return { products: [], suppliers: [] };
  }
}

function writeFavorites(state: FavoritesState): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function getFavorites(): FavoritesState {
  return readFavorites();
}

export function isFavorite(
  entityType: FavoriteEntityType,
  entityId: string,
): boolean {
  const state = readFavorites();
  const list = entityType === "product" ? state.products : state.suppliers;
  return list.includes(entityId);
}

export function toggleFavorite(
  entityType: FavoriteEntityType,
  entityId: string,
): boolean {
  const state = readFavorites();
  const key = entityType === "product" ? "products" : "suppliers";
  const list = state[key];
  const nextList = list.includes(entityId)
    ? list.filter((id) => id !== entityId)
    : [entityId, ...list];
  return writeFavorites({ ...state, [key]: nextList });
}

export function setFavorite(
  entityType: FavoriteEntityType,
  entityId: string,
  favorite: boolean,
): boolean {
  const state = readFavorites();
  const key = entityType === "product" ? "products" : "suppliers";
  const list = state[key];
  const has = list.includes(entityId);
  if (favorite === has) return true;
  const nextList = favorite
    ? [entityId, ...list]
    : list.filter((id) => id !== entityId);
  return writeFavorites({ ...state, [key]: nextList });
}
