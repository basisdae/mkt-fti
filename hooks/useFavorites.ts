"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FAVORITES_CHANGED_EVENT,
  getFavorites,
  isFavorite,
  toggleFavorite,
  type FavoriteEntityType,
  type FavoritesState,
} from "@/lib/favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritesState>({
    products: [],
    suppliers: [],
  });

  const refresh = useCallback(() => {
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    refresh();
    function onChange() {
      refresh();
    }
    window.addEventListener(FAVORITES_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const isFav = useCallback(
    (entityType: FavoriteEntityType, entityId: string) => {
      const list =
        entityType === "product" ? favorites.products : favorites.suppliers;
      return list.includes(entityId);
    },
    [favorites],
  );

  const toggle = useCallback(
    (entityType: FavoriteEntityType, entityId: string) => {
      toggleFavorite(entityType, entityId);
      refresh();
    },
    [refresh],
  );

  return {
    favorites,
    isFavorite: isFav,
    toggleFavorite: toggle,
    refresh,
    // convenience for initial render before effect
    checkFavorite: isFavorite,
  };
}
