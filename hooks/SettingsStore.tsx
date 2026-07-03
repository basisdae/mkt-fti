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

const STORAGE_KEY = "mkt-fti-exchange-rate";
export const DEFAULT_EXCHANGE_RATE = 36;

interface SettingsStoreValue {
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}

const SettingsStoreContext = createContext<SettingsStoreValue | null>(null);

function readStoredExchangeRate(): number {
  if (typeof window === "undefined") return DEFAULT_EXCHANGE_RATE;
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = parseFloat(raw ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_EXCHANGE_RATE;
}

export function SettingsStoreProvider({ children }: { children: ReactNode }) {
  const [exchangeRate, setExchangeRateState] = useState(DEFAULT_EXCHANGE_RATE);

  useEffect(() => {
    setExchangeRateState(readStoredExchangeRate());
  }, []);

  const setExchangeRate = useCallback((rate: number) => {
    const next = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_EXCHANGE_RATE;
    setExchangeRateState(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }, []);

  const value = useMemo(
    (): SettingsStoreValue => ({
      exchangeRate,
      setExchangeRate,
    }),
    [exchangeRate, setExchangeRate],
  );

  return (
    <SettingsStoreContext.Provider value={value}>
      {children}
    </SettingsStoreContext.Provider>
  );
}

export function useSettingsStore(): SettingsStoreValue {
  const ctx = useContext(SettingsStoreContext);
  if (!ctx) {
    throw new Error("useSettingsStore must be used within SettingsStoreProvider");
  }
  return ctx;
}
