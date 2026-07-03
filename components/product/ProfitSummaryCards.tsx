import { Card } from "@/components/ui/Card";
import { formatCurrencyTHB, formatPercent } from "@/lib/utils";
import type { ProfitSummary } from "@/lib/product-detail";

interface ProfitSummaryCardsProps {
  summary: ProfitSummary;
}

export function ProfitSummaryCards({ summary }: ProfitSummaryCardsProps) {
  const cards = [
    {
      title: "Best MOQ",
      subtitle: `${summary.bestMoq.tier.moq.toLocaleString()} units · lowest entry`,
      value: formatCurrencyTHB(summary.bestMoq.pricing.ftiSellingPrice),
      meta: `Cost ${formatCurrencyTHB(summary.bestMoq.pricing.costThb)}`,
      accent: "border-primary/20 bg-light-purple/30",
    },
    {
      title: "Highest Profit",
      subtitle: `${summary.highestProfit.tier.moq.toLocaleString()} MOQ tier`,
      value: formatCurrencyTHB(summary.highestProfit.pricing.ftiProfit),
      meta: `FTI price ${formatCurrencyTHB(summary.highestProfit.pricing.ftiSellingPrice)}`,
      accent: "border-green-200 bg-green-50/50",
      profit: true,
    },
    {
      title: "Best Dealer Margin",
      subtitle: `${formatPercent(summary.bestDealerMargin.pricing.dealerGpPercent)} dealer GP`,
      value: formatCurrencyTHB(
        summary.bestDealerMargin.pricing.dealerSellingPrice,
      ),
      meta: `Dealer profit ${formatCurrencyTHB(summary.bestDealerMargin.pricing.dealerProfit)}`,
      accent: "border-primary/10 bg-card",
    },
    {
      title: "Recommended Selling Price",
      subtitle: `${summary.recommended.tier.moq.toLocaleString()} MOQ · optimal margin`,
      value: formatCurrencyTHB(summary.recommended.pricing.ftiSellingPrice),
      meta: `GP ${formatPercent(summary.recommended.pricing.wholesaleGpPercent)} · Profit ${formatCurrencyTHB(summary.recommended.pricing.ftiProfit)}`,
      accent: "border-primary/30 bg-gradient-to-br from-light-purple/40 to-card",
      highlight: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={card.accent}
          padding="md"
          interactive
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {card.title}
          </p>
          <p
            className={`mt-2 text-2xl font-bold tracking-tight ${
              card.profit
                ? "text-green-800"
                : card.highlight
                  ? "text-primary"
                  : "text-gray-900"
            }`}
          >
            {card.value}
          </p>
          <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
          <p className="mt-2 text-[11px] text-gray-400">{card.meta}</p>
        </Card>
      ))}
    </div>
  );
}
