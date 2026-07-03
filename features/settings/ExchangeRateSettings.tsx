"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/forms/Input";
import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "@/hooks/SettingsStore";

export function ExchangeRateSettings() {
  const { exchangeRate, setExchangeRate } = useSettingsStore();
  const [draft, setDraft] = useState(String(exchangeRate));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(String(exchangeRate));
  }, [exchangeRate]);

  function handleSave() {
    const parsed = parseFloat(draft);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setExchangeRate(parsed);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card interactive>
      <h2 className="mb-1 text-base font-semibold text-gray-900">Pricing</h2>
      <p className="mb-4 text-xs text-gray-500">
        Global THB/USD exchange rate used for all MOQ pricing calculations.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Exchange Rate (THB per USD)"
            type="number"
            min={0}
            step="0.01"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={handleSave}>
          {saved ? "Saved" : "Save Rate"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-[#8A94A6]">
        Current active rate:{" "}
        <span className="font-semibold text-gray-700">
          {exchangeRate.toFixed(2)} THB/USD
        </span>
      </p>
    </Card>
  );
}
