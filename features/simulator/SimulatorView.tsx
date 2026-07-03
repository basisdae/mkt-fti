"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Button } from "@/components/ui/Button";
import { ScenarioTable } from "@/components/simulator/ScenarioTable";
import {
  buildScenarioRow,
  calculatePricing,
  calculateSimulator,
  isLowProfitMargin,
} from "@/lib/pricing";
import { getProducts, simulatorDefaults } from "@/lib/mock-data";
import { cn, formatCurrencyTHB, formatPercent } from "@/lib/utils";
import type { ScenarioRow } from "@/lib/pricing";

export function SimulatorView() {
  const [productId, setProductId] = useState(simulatorDefaults.productId);
  const [tierId, setTierId] = useState("");
  const [targetRevenue, setTargetRevenue] = useState(
    simulatorDefaults.targetRevenue,
  );
  const [expectedQty, setExpectedQty] = useState(
    simulatorDefaults.expectedQty,
  );
  const [scenarioRows, setScenarioRows] = useState<ScenarioRow[]>([]);

  const product = useMemo(
    () => getProducts().find((p) => p.id === productId) ?? getProducts()[0],
    [productId],
  );

  const activeTierId = tierId || product.priceOptions[0].id;
  const selectedTier = useMemo(
    () =>
      product.priceOptions.find((t) => t.id === activeTierId) ??
      product.priceOptions[0],
    [product, activeTierId],
  );

  const pricing = useMemo(
    () => calculatePricing(selectedTier),
    [selectedTier],
  );

  const result = useMemo(
    () =>
      calculateSimulator({
        pricing,
        expectedQty,
        targetRevenue,
      }),
    [pricing, expectedQty, targetRevenue],
  );

  const lowMargin = isLowProfitMargin(result.grossProfitPercent);
  const revenueGap = targetRevenue - result.revenue;

  const productOptions = getProducts().map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const moqOptions = product.priceOptions.map((t) => ({
    value: t.id,
    label: `${t.moq.toLocaleString()}${t.label ? ` · ${t.label}` : ""}`,
  }));

  function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextProduct = getProducts().find((p) => p.id === e.target.value);
    setProductId(e.target.value);
    setTierId(nextProduct?.priceOptions[0].id ?? "");
  }

  function handleAddToScenario() {
    if (expectedQty <= 0) return;

    setScenarioRows((prev) => [
      ...prev,
      buildScenarioRow(
        product.id,
        product.name,
        expectedQty,
        pricing.ftiSellingPrice,
        pricing.costThb,
      ),
    ]);
  }

  function handleRemoveRow(id: string) {
    setScenarioRows((prev) => prev.filter((row) => row.id !== id));
  }

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <h1 className="page-title">Target Simulator</h1>
        <p className="page-description">
          Model revenue targets, build multi-product scenarios, and track
          margin performance.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2" interactive>
          <h2 className="mb-5 text-base font-semibold text-gray-900">
            Inputs
          </h2>
          <div className="space-y-4">
            <Select
              label="Select Product"
              options={productOptions}
              value={productId}
              onChange={handleProductChange}
            />
            <Select
              label="MOQ Tier"
              options={moqOptions}
              value={activeTierId}
              onChange={(e) => setTierId(e.target.value)}
            />
            <Input
              label="Target Revenue (THB)"
              type="number"
              min={0}
              value={targetRevenue}
              onChange={(e) =>
                setTargetRevenue(Number(e.target.value) || 0)
              }
            />
            <Input
              label="Expected Quantity"
              type="number"
              min={0}
              value={expectedQty}
              onChange={(e) => setExpectedQty(Number(e.target.value) || 0)}
            />

            <div className="rounded-xl bg-light-purple/50 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Unit pricing</p>
              <p className="mt-1 text-lg font-bold text-primary">
                {formatCurrencyTHB(pricing.ftiSellingPrice)}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Cost: {formatCurrencyTHB(pricing.costThb)} · GP{" "}
                {formatPercent(pricing.wholesaleGpPercent)}
              </p>
            </div>

            {lowMargin && (
              <div className="warning-banner">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Profit margin below 25%
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleAddToScenario}
              disabled={expectedQty <= 0}
            >
              <Plus className="h-4 w-4" />
              Add to Scenario
            </Button>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <ResultCard label="Revenue" value={formatCurrencyTHB(result.revenue)}>
              {expectedQty.toLocaleString()} ×{" "}
              {formatCurrencyTHB(pricing.ftiSellingPrice)}
            </ResultCard>
            <ResultCard
              label="Total Cost"
              value={formatCurrencyTHB(result.totalCost)}
            >
              {expectedQty.toLocaleString()} ×{" "}
              {formatCurrencyTHB(pricing.costThb)}
            </ResultCard>
            <ResultCard
              label="Gross Profit"
              value={formatCurrencyTHB(result.grossProfit)}
              profit
              lowMargin={lowMargin}
            >
              {formatPercent(result.grossProfitPercent)} margin
            </ResultCard>
            <ResultCard
              label="Required Qty for 100M"
              value={`${result.requiredQtyFor100M.toLocaleString()} units`}
              accent
            >
              At {formatCurrencyTHB(pricing.ftiSellingPrice)} / unit
            </ResultCard>
          </div>

          <Card interactive>
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Target vs Expected
            </h2>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Target Revenue
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrencyTHB(targetRevenue)}
                </dd>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Projected Revenue
                </dt>
                <dd className="mt-1 text-sm font-semibold text-primary">
                  {formatCurrencyTHB(result.revenue)}
                </dd>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Gap
                </dt>
                <dd
                  className={cn(
                    "mt-1 text-sm font-semibold",
                    revenueGap > 0 ? "text-fti-red" : "text-green-800",
                  )}
                >
                  {revenueGap > 0 ? "−" : "+"}
                  {formatCurrencyTHB(Math.abs(revenueGap))}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <ScenarioTable rows={scenarioRows} onRemove={handleRemoveRow} />
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  children,
  profit,
  lowMargin,
  accent,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
  profit?: boolean;
  lowMargin?: boolean;
  accent?: boolean;
}) {
  return (
    <Card
      interactive
      className={cn(
        profit && !lowMargin && "bg-gradient-to-br from-green-50/80 to-card",
        profit && lowMargin && "border-red-200 bg-red-50/50",
        accent && "border-primary/20 bg-light-purple/30",
        !profit && !accent && "bg-gradient-to-br from-light-purple/40 to-card",
      )}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold",
          profit && !lowMargin && "text-green-800",
          profit && lowMargin && "text-fti-red",
          accent && "text-primary",
          !profit && !accent && "text-gray-900",
        )}
      >
        {value}
      </p>
      {children && (
        <p className="mt-1 text-xs text-gray-400">{children}</p>
      )}
    </Card>
  );
}
