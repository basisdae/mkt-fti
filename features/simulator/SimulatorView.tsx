"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CircleDollarSign,
  Hash,
  Package,
  Percent,
  Plus,
  Receipt,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageEmptyState } from "@/components/empty/PageEmptyState";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Button } from "@/components/ui/Button";
import {
  SimulatorKpiCard,
  SimulatorKpiGrid,
} from "@/components/simulator/SimulatorKpiCard";
import { ScenarioTable } from "@/components/simulator/ScenarioTable";
import { SimulatorPlansModal } from "@/components/simulator/SimulatorPlansModal";
import { SimulatorUndoToolbar } from "@/components/simulator/SimulatorUndoToolbar";
import { SimulatorUnitPreview } from "@/components/simulator/SimulatorUnitPreview";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import {
  buildScenarioRow,
  calculatePricing,
  calculateSimulator,
  isLowProfitMargin,
} from "@/lib/pricing";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { SIMULATOR_COPY as t } from "@/lib/simulator-i18n";
import {
  EMPTY_SIMULATOR_NOTES,
  type SimulatorPlan,
  type SimulatorPlanSnapshot,
  saveSimulatorPlan,
} from "@/lib/simulator-plans";
import {
  downloadBlob,
  exportSalesPlanWorkbook,
  salesPlanFileName,
} from "@/lib/simulator-sales-plan-export";
import { resolveProductImageAlt } from "@/lib/product-image";
import { formatCurrencyTHB, formatPercent } from "@/lib/utils";
import type { ScenarioRow } from "@/lib/pricing";

const fieldLabelClass = "text-sm font-semibold text-[#1F2937]";

function SimulatorSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-[#1F2937]">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SimulatorDivider() {
  return <div className="my-5 h-px bg-[#EEF0F6]" role="separator" />;
}

export function SimulatorView({
  projectId: _projectId,
}: {
  projectId?: string;
} = {}) {
  const catalogProducts = useLiveProducts();
  const [productId, setProductId] = useState("");
  const [tierId, setTierId] = useState("");
  const [targetRevenue, setTargetRevenue] = useState(50_000_000);
  const [expectedQty, setExpectedQty] = useState(0);
  const [planName, setPlanName] = useState("");
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [exportingPlan, setExportingPlan] = useState(false);
  const [planToast, setPlanToast] = useState<string | null>(null);

  useEffect(() => {
    if (catalogProducts.length === 0) {
      setProductId("");
      setTierId("");
      return;
    }
    if (!productId || !catalogProducts.some((p) => p.id === productId)) {
      const first = catalogProducts[0]!;
      setProductId(first.id);
      setTierId(first.priceOptions[0]?.id ?? "");
    }
  }, [catalogProducts, productId]);

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
    () => catalogProducts.find((p) => p.id === productId),
    [catalogProducts, productId],
  );

  const activeTierId = tierId || product?.priceOptions[0]?.id || "";
  const selectedTier = useMemo(
    () =>
      product?.priceOptions.find((tier) => tier.id === activeTierId) ??
      product?.priceOptions[0],
    [product, activeTierId],
  );

  const pricing = useMemo(
    () => (selectedTier ? calculatePricing(selectedTier) : null),
    [selectedTier],
  );

  const result = useMemo(
    () =>
      pricing
        ? calculateSimulator({
            pricing,
            expectedQty,
            targetRevenue,
          })
        : {
            revenue: 0,
            totalCost: 0,
            grossProfit: 0,
            grossProfitPercent: 0,
            requiredQtyFor100M: 0,
          },
    [pricing, expectedQty, targetRevenue],
  );

  const lowMargin = pricing ? isLowProfitMargin(result.grossProfitPercent) : false;
  const revenueGap = targetRevenue - result.revenue;
  const exceedsTarget = revenueGap <= 0;
  const qtyLabel = expectedQty.toLocaleString("th-TH");
  const sellingPrice = pricing?.ftiSellingPrice ?? 0;

  const qtyForTarget = useMemo(
    () =>
      sellingPrice > 0 ? Math.ceil(targetRevenue / sellingPrice) : 0,
    [targetRevenue, sellingPrice],
  );

  const additionalQtyNeeded = useMemo(() => {
    if (exceedsTarget || sellingPrice <= 0) return 0;
    return Math.ceil(revenueGap / sellingPrice);
  }, [exceedsTarget, revenueGap, sellingPrice]);

  const productOptions = catalogProducts.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const moqOptions =
    product?.priceOptions.map((tier) => ({
      value: tier.id,
      label: `${tier.moq.toLocaleString("th-TH")} ชิ้น${tier.label ? ` · ${tier.label}` : ""}`,
    })) ?? [];

  function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextProduct = catalogProducts.find((p) => p.id === e.target.value);
    setProductId(e.target.value);
    setTierId(nextProduct?.priceOptions[0]?.id ?? "");
  }

  function handleAddToScenario() {
    if (!product || !pricing || expectedQty <= 0 || !selectedTier) return;

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

  function buildPlanSnapshot(): SimulatorPlanSnapshot {
    return {
      productId,
      tierId: activeTierId,
      targetRevenue,
      expectedQty,
      scenarioRows,
      notes: EMPTY_SIMULATOR_NOTES,
    };
  }

  function handleSaveProject() {
    const name =
      planName.trim() ||
      window.prompt("ชื่อแผน / แคมเปญ", planName || "Sales Plan")?.trim();
    if (!name) return;

    const result = saveSimulatorPlan(name, buildPlanSnapshot(), activePlanId);
    if (!result.ok) {
      setPlanToast(result.error ?? "ไม่สามารถบันทึกแผนได้");
      return;
    }

    setPlanName(result.plan.name);
    setActivePlanId(result.plan.id);
    setPlanToast(`บันทึกแผน "${result.plan.name}" แล้ว`);
  }

  function handleOpenPlan(plan: SimulatorPlan) {
    setProductId(plan.productId);
    setTierId(plan.tierId);
    setTargetRevenue(plan.targetRevenue);
    setExpectedQty(plan.expectedQty);
    commitScenarioRows(plan.scenarioRows);
    setPlanName(plan.name);
    setActivePlanId(plan.id);
    setPlansModalOpen(false);
    setPlanToast(`โหลดแผน "${plan.name}" แล้ว`);
  }

  function handleResetPlan() {
    if (
      scenarioRows.length > 0 &&
      !window.confirm(t.resetPlanConfirm)
    ) {
      return;
    }

    commitScenarioRows([]);
    setActivePlanId(null);
    setPlanToast(null);
  }

  async function handleExportSalesPlan(rows = scenarioRows) {
    if (rows.length === 0) return;

    setExportingPlan(true);
    try {
      const blob = await exportSalesPlanWorkbook(rows, catalogProducts);
      downloadBlob(blob, salesPlanFileName());
    } catch (err) {
      console.error("Sales plan export failed:", err);
      setPlanToast(t.exportSalesPlanFailed);
    } finally {
      setExportingPlan(false);
    }
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
        <h1 className="page-title font-bold text-gray-900">{t.pageTitle}</h1>
        <p className="page-description text-[#667085]">{t.pageSubtitle}</p>
      </div>

      {catalogProducts.length === 0 ? (
        <>
          <PageEmptyState
            icon={Package}
            title="ยังไม่มีสินค้าสำหรับจำลอง"
            description="เพิ่มสินค้าก่อน แล้วจึงสร้างแผนจำลองยอดขายและกำไร"
          >
            <Link href="/products/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                เพิ่มสินค้า
              </Button>
            </Link>
          </PageEmptyState>
        </>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2" interactive>
            <h2 className="mb-5 text-base font-semibold text-[#1F2937]">
              {t.inputsTitle}
            </h2>

            <SimulatorSection title={t.sectionProductSelection}>
              <div className="flex items-center gap-4 rounded-xl border border-[#EEF0F6] bg-[#FBFBFD] p-3">
                <ProductImageDisplay
                  src={product?.imageUrl}
                  alt={product ? resolveProductImageAlt(product) : "—"}
                  size="md"
                  className="p-1.5"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1F2937]">
                    {product?.name}
                  </p>
                  <p className="truncate text-xs text-[#8A94A6]">
                    {product?.supplier}
                  </p>
                </div>
              </div>

              <Select
                label={t.selectProduct}
                labelClassName={fieldLabelClass}
                options={productOptions}
                value={productId}
                onChange={handleProductChange}
              />
              <Select
                label={t.moqTier}
                labelClassName={fieldLabelClass}
                options={moqOptions}
                value={activeTierId}
                onChange={(e) => setTierId(e.target.value)}
              />
            </SimulatorSection>

            <SimulatorDivider />

            <SimulatorSection title={t.sectionSalesTarget}>
              <Input
                label={t.targetRevenue}
                labelClassName={fieldLabelClass}
                type="number"
                min={0}
                value={targetRevenue}
                onChange={(e) =>
                  setTargetRevenue(Number(e.target.value) || 0)
                }
              />
              <Input
                label={t.expectedQty}
                labelClassName={fieldLabelClass}
                type="number"
                min={0}
                value={expectedQty}
                onChange={(e) => setExpectedQty(Number(e.target.value) || 0)}
              />
            </SimulatorSection>

            <SimulatorDivider />

            <SimulatorSection title={t.sectionResultPreview}>
              {pricing && <SimulatorUnitPreview pricing={pricing} />}

              {lowMargin && (
                <div className="warning-banner">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {t.lowMarginWarning}
                </div>
              )}
            </SimulatorSection>

            <div className="mt-5">
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

          <div className="flex min-w-0 flex-col gap-4 lg:col-span-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-5.5rem)] lg:self-start">
            <SimulatorKpiGrid className="shrink-0">
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
                  formatCurrencyTHB(pricing?.costThb ?? 0),
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

            <div className="min-h-0 flex-1 overflow-y-auto">
              <ScenarioTable
                rows={scenarioRows}
                onChange={handleScenarioChange}
                historyRevision={scenarioRevision}
                headerActions={{
                  planName,
                  onPlanNameChange: setPlanName,
                  onSave: handleSaveProject,
                  onLoad: () => setPlansModalOpen(true),
                  onReset: handleResetPlan,
                  onExport: () => handleExportSalesPlan(),
                  exporting: exportingPlan,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {planToast && (
        <p className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm text-gray-700">
          {planToast}
        </p>
      )}

      <SimulatorPlansModal
        open={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
        onOpenPlan={handleOpenPlan}
        onExportPlan={(plan) => handleExportSalesPlan(plan.scenarioRows)}
      />
    </div>
  );
}
