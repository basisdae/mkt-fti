"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CircleDollarSign,
  Hash,
  Percent,
  Plus,
  Receipt,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Button } from "@/components/ui/Button";
import {
  SimulatorKpiCard,
  SimulatorKpiGrid,
} from "@/components/simulator/SimulatorKpiCard";
import { ScenarioTable } from "@/components/simulator/ScenarioTable";
import { SimulatorUndoToolbar } from "@/components/simulator/SimulatorUndoToolbar";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import {
  buildScenarioRow,
  calculatePricing,
  calculateSimulator,
  isLowProfitMargin,
} from "@/lib/pricing";
import { getProducts, simulatorDefaults } from "@/lib/mock-data";
import { SIMULATOR_COPY as t } from "@/lib/simulator-i18n";
import { resolveProductImageAlt } from "@/lib/product-image";
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

  const {
    state: scenarioRows,
    commit: commitScenarioRows,
    undo,
    redo,
    canUndo,
    canRedo,
    revision: scenarioRevision,
  } = useUndoRedo<ScenarioRow[]>([]);

  const product = useMemo(
    () => getProducts().find((p) => p.id === productId) ?? getProducts()[0],
    [productId],
  );

  const activeTierId = tierId || product.priceOptions[0].id;
  const selectedTier = useMemo(
    () =>
      product.priceOptions.find((tier) => tier.id === activeTierId) ??
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
  const exceedsTarget = revenueGap <= 0;
  const qtyLabel = expectedQty.toLocaleString("th-TH");
  const sellingPrice = pricing.ftiSellingPrice;

  const qtyForTarget = useMemo(
    () =>
      sellingPrice > 0 ? Math.ceil(targetRevenue / sellingPrice) : 0,
    [targetRevenue, sellingPrice],
  );

  const additionalQtyNeeded = useMemo(() => {
    if (exceedsTarget || sellingPrice <= 0) return 0;
    return Math.ceil(revenueGap / sellingPrice);
  }, [exceedsTarget, revenueGap, sellingPrice]);

  const productOptions = getProducts().map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const moqOptions = product.priceOptions.map((tier) => ({
    value: tier.id,
    label: `${tier.moq.toLocaleString("th-TH")} ชิ้น${tier.label ? ` · ${tier.label}` : ""}`,
  }));

  function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextProduct = getProducts().find((p) => p.id === e.target.value);
    setProductId(e.target.value);
    setTierId(nextProduct?.priceOptions[0].id ?? "");
  }

  function handleAddToScenario() {
    if (expectedQty <= 0) return;

    commitScenarioRows([
      ...scenarioRows,
      buildScenarioRow(
        product.id,
        product.name,
        expectedQty,
        pricing.ftiSellingPrice,
        pricing.costThb,
        {
          moqTierId: activeTierId,
          moq: selectedTier.moq,
          targetRevenue,
        },
      ),
    ]);
  }

  function handleScenarioChange(nextRows: ScenarioRow[]) {
    commitScenarioRows(nextRows);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (
        event.key.toLowerCase() === "y" ||
        (event.key.toLowerCase() === "z" && event.shiftKey)
      ) {
        event.preventDefault();
        redo();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  return (
    <div className="page-shell">
      <SimulatorUndoToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="page-header-block">
        <h1 className="page-title">{t.pageTitle}</h1>
        <p className="page-description">{t.pageSubtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2" interactive>
          <h2 className="mb-5 text-base font-semibold text-gray-900">
            {t.inputsTitle}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-light-purple/30 p-3">
              <ProductImageDisplay
                src={product.imageUrl}
                alt={resolveProductImageAlt(product)}
                size="md"
                className="p-1.5"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {product.name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {product.supplier}
                </p>
              </div>
            </div>

            <Select
              label={t.selectProduct}
              options={productOptions}
              value={productId}
              onChange={handleProductChange}
            />
            <Select
              label={t.moqTier}
              options={moqOptions}
              value={activeTierId}
              onChange={(e) => setTierId(e.target.value)}
            />
            <Input
              label={t.targetRevenue}
              type="number"
              min={0}
              value={targetRevenue}
              onChange={(e) =>
                setTargetRevenue(Number(e.target.value) || 0)
              }
            />
            <Input
              label={t.expectedQty}
              type="number"
              min={0}
              value={expectedQty}
              onChange={(e) => setExpectedQty(Number(e.target.value) || 0)}
            />

            <div className="rounded-xl bg-light-purple/50 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">
                {t.unitPricingTitle}
              </p>
              <p className="mt-2 text-xs text-gray-500">{t.sellingPrice}</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrencyTHB(pricing.ftiSellingPrice)}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">{t.costPerUnit}</p>
                  <p className="font-medium text-gray-700">
                    {formatCurrencyTHB(pricing.costThb)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">{t.profitPerUnit}</p>
                  <p
                    className={cn(
                      "font-semibold",
                      isLowProfitMargin(pricing.wholesaleGpPercent)
                        ? "text-fti-red"
                        : "text-green-800",
                    )}
                  >
                    {formatCurrencyTHB(pricing.ftiProfit)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                {t.profitMargin}: {formatPercent(pricing.wholesaleGpPercent)}
              </p>
            </div>

            {lowMargin && (
              <div className="warning-banner">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {t.lowMarginWarning}
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
              {t.addToScenario}
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-3">
          <SimulatorKpiGrid>
            <SimulatorKpiCard
              label={t.summaryRevenue}
              value={formatCurrencyTHB(result.revenue)}
              subtitle={t.revenueCalcHint(
                qtyLabel,
                formatCurrencyTHB(sellingPrice),
              )}
              icon={TrendingUp}
              variant="neutral"
            />
            <SimulatorKpiCard
              label={t.summaryTotalCost}
              value={formatCurrencyTHB(result.totalCost)}
              subtitle={t.costCalcHint(
                qtyLabel,
                formatCurrencyTHB(pricing.costThb),
              )}
              icon={Receipt}
              variant="neutral"
            />
            <SimulatorKpiCard
              label={t.summaryGrossProfit}
              value={formatCurrencyTHB(result.grossProfit)}
              subtitle={t.profitMarginHint(
                formatPercent(result.grossProfitPercent),
              )}
              icon={CircleDollarSign}
              variant={lowMargin ? "profit-warn" : "profit"}
            />
            <SimulatorKpiCard
              label={t.summaryProfitPercent}
              value={formatPercent(result.grossProfitPercent)}
              subtitle={t.profitMarginHint(
                formatPercent(result.grossProfitPercent),
              )}
              icon={Percent}
              variant={lowMargin ? "profit-warn" : "profit"}
            />
            <SimulatorKpiCard
              label={t.summaryExcessTarget}
              value={formatCurrencyTHB(Math.abs(revenueGap))}
              subtitle={
                exceedsTarget ? t.excessAboveTarget : t.excessBelowTarget
              }
              icon={Target}
              variant={exceedsTarget ? "goal" : "warn"}
            />
            <SimulatorKpiCard
              label={t.summaryQtyRequired}
              value={t.qtyUnits(qtyForTarget)}
              subtitle={
                exceedsTarget
                  ? t.qtyRequiredHint(formatCurrencyTHB(sellingPrice))
                  : t.qtyRequiredGapHint(
                      additionalQtyNeeded.toLocaleString("th-TH"),
                    )
              }
              icon={Hash}
              variant="goal"
            />
          </SimulatorKpiGrid>
        </div>
      </div>

      <div className="mt-8">
        <ScenarioTable
          rows={scenarioRows}
          onChange={handleScenarioChange}
          historyRevision={scenarioRevision}
        />
      </div>
    </div>
  );
}
