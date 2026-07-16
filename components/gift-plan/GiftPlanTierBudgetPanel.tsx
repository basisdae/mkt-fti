"use client";

import { GiftPlanFormattedNumberInput } from "@/components/gift-plan/GiftPlanFormattedNumberInput";
import { Input } from "@/components/forms/Input";
import {
  calcTierBudget,
  resolveTierActualCustomerCount,
  toTierBudgetCalcInput,
} from "@/lib/gift-plan-calculations";
import { formatGiftMoney, formatGiftPercent } from "@/lib/gift-plan-format";
import {
  formatGiftPlanIntegerInput,
  parseGiftPlanInteger,
} from "@/lib/gift-plan-number-field";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { cn } from "@/lib/utils";
import type { GiftPlanTierInput } from "@/types/gift-plan";
import { useEffect, useMemo, useState } from "react";

interface GiftPlanTierBudgetPanelProps {
  tier: GiftPlanTierInput;
  onUpdateTier: (patch: Partial<GiftPlanTierInput>) => void;
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className={cn("font-medium text-gray-900 tabular-nums", valueClassName)}>
        {value}
      </dd>
    </div>
  );
}

export function GiftPlanTierBudgetPanel({
  tier,
  onUpdateTier,
}: GiftPlanTierBudgetPanelProps) {
  const [estimatedCustomersText, setEstimatedCustomersText] = useState(() =>
    formatGiftPlanIntegerInput(tier.estimated_customer_count),
  );
  const [customersFocused, setCustomersFocused] = useState(false);

  useEffect(() => {
    if (customersFocused) return;
    setEstimatedCustomersText(
      formatGiftPlanIntegerInput(tier.estimated_customer_count),
    );
  }, [tier.estimated_customer_count, customersFocused]);

  const budget = useMemo(
    () => calcTierBudget(toTierBudgetCalcInput(tier)),
    [tier],
  );

  const actualCustomerCount = resolveTierActualCustomerCount(tier.id);

  const currentPlanValueLabel =
    budget.current_plan_value_status === "unset"
      ? t.budgetCurrentPlanUnset
      : formatGiftMoney(budget.current_plan_value);

  const remainingLabel =
    budget.budget_remaining == null
      ? "—"
      : budget.is_over_budget
        ? `${formatGiftMoney(Math.abs(budget.budget_remaining))} ${t.budgetOverSuffix}`
        : formatGiftMoney(budget.budget_remaining);

  const remainingClass = budget.is_over_budget
    ? "text-rose-800"
    : budget.budget_remaining != null
      ? "text-slate-700"
      : undefined;

  const inBudgetClass =
    budget.budget_remaining != null && !budget.is_over_budget
      ? "text-emerald-800"
      : undefined;

  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t.tierBudgetTitle}</h3>
        <p className="mt-1 text-xs text-gray-500">{t.tierBudgetSubtitle}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <GiftPlanFormattedNumberInput
          label={t.estimatedTotalSales}
          hint={t.estimatedTotalSalesHint}
          value={tier.estimated_total_sales}
          onChange={(value) => onUpdateTier({ estimated_total_sales: value })}
        />
        <GiftPlanFormattedNumberInput
          label={t.giftBudgetPercent}
          hint={t.giftBudgetPercentHint}
          value={tier.gift_budget_percent}
          maxFractionDigits={4}
          onChange={(value) => onUpdateTier({ gift_budget_percent: value })}
        />
        <Input
          label={t.estimatedCustomerCount}
          hint={t.estimatedCustomerCountHint}
          inputMode="numeric"
          placeholder={t.optionalPlaceholder}
          value={estimatedCustomersText}
          onFocus={() => setCustomersFocused(true)}
          onBlur={() => {
            setCustomersFocused(false);
            const parsed = parseGiftPlanInteger(estimatedCustomersText);
            onUpdateTier({ estimated_customer_count: parsed });
            setEstimatedCustomersText(formatGiftPlanIntegerInput(parsed));
          }}
          onChange={(event) => {
            const next = event.target.value;
            setEstimatedCustomersText(next);
            const parsed = parseGiftPlanInteger(next);
            if (next.trim() === "" || parsed != null) {
              onUpdateTier({ estimated_customer_count: parsed });
            }
          }}
        />
      </div>

      <div className="mt-4 rounded-xl border border-white bg-white p-4 shadow-sm">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {t.tierBudgetSummaryTitle}
        </h4>
        <dl className="mt-3 space-y-2">
          <SummaryRow
            label={t.estimatedTotalSales}
            value={
              tier.estimated_total_sales != null
                ? `${formatGiftMoney(tier.estimated_total_sales)} ${t.bahtSuffix}`
                : "—"
            }
          />
          <SummaryRow
            label={t.giftBudgetPercentSet}
            value={
              tier.gift_budget_percent != null
                ? formatGiftPercent(tier.gift_budget_percent)
                : "—"
            }
          />
          <SummaryRow
            label={t.budgetTarget}
            value={
              budget.tier_budget_target != null
                ? `${formatGiftMoney(budget.tier_budget_target)} ${t.bahtSuffix}`
                : "—"
            }
          />
          <SummaryRow
            label={t.budgetCurrentPlanValue}
            value={currentPlanValueLabel}
          />
          <SummaryRow
            label={budget.is_over_budget ? t.budgetOverLabel : t.budgetRemaining}
            value={remainingLabel}
            valueClassName={budget.is_over_budget ? remainingClass : inBudgetClass}
          />
          <SummaryRow
            label={t.budgetActualPercentOfSales}
            value={
              budget.actual_percent_of_sales != null
                ? formatGiftPercent(budget.actual_percent_of_sales)
                : "—"
            }
            valueClassName={budget.is_over_budget ? "text-rose-800" : undefined}
          />
          {budget.budget_used_percent != null ? (
            <SummaryRow
              label={t.budgetUsedPercent}
              value={formatGiftPercent(budget.budget_used_percent)}
              valueClassName={budget.is_over_budget ? "text-rose-800" : inBudgetClass}
            />
          ) : null}
          {tier.estimated_customer_count != null &&
          tier.estimated_customer_count > 0 ? (
            <SummaryRow
              label={t.estimatedCustomerCount}
              value={tier.estimated_customer_count.toLocaleString("th-TH")}
            />
          ) : null}
          <SummaryRow
            label={t.actualCustomerCount}
            value={
              actualCustomerCount > 0
                ? actualCustomerCount.toLocaleString("th-TH")
                : t.notSpecifiedYet
            }
          />
          {budget.avg_budget_per_customer != null ? (
            <SummaryRow
              label={t.avgBudgetPerCustomer}
              value={`${formatGiftMoney(budget.avg_budget_per_customer)} ${t.bahtSuffix}`}
            />
          ) : null}
        </dl>

        {budget.is_over_budget ? (
          <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {t.budgetOverWarning}
          </p>
        ) : null}
      </div>
    </section>
  );
}
