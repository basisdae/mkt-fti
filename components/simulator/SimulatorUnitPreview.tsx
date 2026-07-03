import { SIMULATOR_COPY as t } from "@/lib/simulator-i18n";
import type { PricingResult } from "@/lib/pricing";
import { isLowProfitMargin } from "@/lib/pricing";
import { cn, formatCurrencyTHB, formatPercent } from "@/lib/utils";

interface SimulatorUnitPreviewProps {
  pricing: PricingResult;
}

type PreviewTone = "selling" | "cost" | "profit" | "margin";

const toneStyles: Record<
  PreviewTone,
  { cell: string; value: string }
> = {
  selling: {
    cell: "bg-light-purple/40",
    value: "text-primary",
  },
  cost: {
    cell: "bg-gray-50",
    value: "text-gray-800",
  },
  profit: {
    cell: "bg-green-50/80",
    value: "text-green-800",
  },
  margin: {
    cell: "bg-sky-50/70",
    value: "text-slate-700",
  },
};

interface PreviewKpiProps {
  label: string;
  value: string;
  hint?: string;
  tone: PreviewTone;
  valueClassName?: string;
}

function PreviewKpi({
  label,
  value,
  hint,
  tone,
  valueClassName,
}: PreviewKpiProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        "flex min-h-[96px] flex-col justify-between p-4",
        styles.cell,
      )}
    >
      <p className="text-xs font-medium text-[#8A94A6]">{label}</p>
      <div>
        <p
          className={cn(
            "text-xl font-bold tracking-tight sm:text-2xl",
            styles.value,
            valueClassName,
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-[11px] leading-snug text-[#8A94A6]">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

export function SimulatorUnitPreview({ pricing }: SimulatorUnitPreviewProps) {
  const lowMargin = isLowProfitMargin(pricing.wholesaleGpPercent);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EEF0F6] bg-[#EEF0F6]">
      <div className="grid grid-cols-1 divide-y divide-[#EEF0F6] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <PreviewKpi
          label={t.sellingPrice}
          value={formatCurrencyTHB(pricing.ftiSellingPrice)}
          hint={t.perUnit}
          tone="selling"
        />
        <PreviewKpi
          label={t.costPerUnit}
          value={formatCurrencyTHB(pricing.costThb)}
          hint={t.perUnit}
          tone="cost"
        />
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#EEF0F6] border-t border-[#EEF0F6] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <PreviewKpi
          label={t.profitPerUnit}
          value={formatCurrencyTHB(pricing.ftiProfit)}
          hint={t.perUnit}
          tone="profit"
          valueClassName={lowMargin ? "text-fti-red" : undefined}
        />
        <PreviewKpi
          label={t.profitMargin}
          value={formatPercent(pricing.wholesaleGpPercent)}
          tone="margin"
          valueClassName={lowMargin ? "text-fti-red" : undefined}
        />
      </div>
    </div>
  );
}
