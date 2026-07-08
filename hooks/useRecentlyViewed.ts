"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listRecentlyViewed,
  RECENTLY_VIEWED_EVENT,
  trackRecentlyViewed,
  type RecentViewItem,
} from "@/lib/recently-viewed";

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentViewItem[]>([]);

  const refresh = useCallback(() => {
    setItems(listRecentlyViewed());
  }, []);

  useEffect(() => {
    refresh();
    function onChange() {
      refresh();
    }
    window.addEventListener(RECENTLY_VIEWED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return { items, refresh, trackRecentlyViewed };
}
