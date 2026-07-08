"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AssetPlatform } from "@/lib/asset-platforms";
import {
  loadAssetPlatforms,
  saveAssetPlatforms,
} from "@/lib/services/asset-platforms";

interface AssetPlatformStoreValue {
  platforms: AssetPlatform[];
  ready: boolean;
  refresh: () => Promise<void>;
  save: (platforms: AssetPlatform[]) => Promise<void>;
}

const AssetPlatformStoreContext =
  createContext<AssetPlatformStoreValue | null>(null);

export function AssetPlatformStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [platforms, setPlatforms] = useState<AssetPlatform[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await loadAssetPlatforms();
    setPlatforms(next);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (next: AssetPlatform[]) => {
    const saved = await saveAssetPlatforms(next);
    setPlatforms(saved);
  }, []);

  const value = useMemo(
    () => ({ platforms, ready, refresh, save }),
    [platforms, ready, refresh, save],
  );

  return (
    <AssetPlatformStoreContext.Provider value={value}>
      {children}
    </AssetPlatformStoreContext.Provider>
  );
}

export function useAssetPlatforms(): AssetPlatformStoreValue {
  const ctx = useContext(AssetPlatformStoreContext);
  if (!ctx) {
    throw new Error(
      "useAssetPlatforms must be used within AssetPlatformStoreProvider",
    );
  }
  return ctx;
}
