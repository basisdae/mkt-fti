"use client";

import { ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  computeEvaluationResult,
  EVALUATION_MAX_SCORE,
  getRecommendationBadgeClasses,
  getScoreColorClasses,
} from "@/lib/evaluation-scorecard";
import { cn, formatDate } from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface EvaluationScorecardCardProps {
  product: ProductView;
  className?: string;
}

export function EvaluationScorecardCard({
  product,
  className,
}: EvaluationScorecardCardProps) {
  const result = computeEvaluationResult(product.evaluationScorecard);
  const { evaluationScorecard } = product;

  return (
    <Card
      padding="lg"
      className={cn(
        "border-primary/10 bg-gradient-to-br from-light-purple/20 via-card to-white",
        className,
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              แบบประเมินผลิตภัณฑ์
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              การให้คะแนนแบบคณะกรรมการ · น้ำหนักรวม 100 คะแนน
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/15 bg-light-purple/30 px-5 py-4 text-center sm:min-w-[160px]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            คะแนนรวม
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900">
            {result.totalScore}
            <span className="text-lg font-semibold text-gray-400">
              /{EVALUATION_MAX_SCORE}
            </span>
          </p>
          <span
            className={cn(
              "mt-2 inline-block rounded-full border px-3 py-1 text-[11px] font-semibold",
              getRecommendationBadgeClasses(result.recommendation.tier),
            )}
          >
            {result.recommendation.label}
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-gray-500">
        <span>
          ผู้ประเมิน:{" "}
          <span className="font-medium text-gray-700">
            {evaluationScorecard.evaluator || "—"}
          </span>
        </span>
        <span className="text-gray-300">·</span>
        <span>
          วันที่ประเมิน:{" "}
          <span className="font-medium text-gray-700">
            {formatDate(evaluationScorecard.evaluatedAt)}
          </span>
        </span>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-gray-100">
        <div className="hidden grid-cols-[1fr_72px_64px_80px] gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 sm:grid">
          <span>เกณฑ์</span>
          <span className="text-center">คะแนน</span>
          <span className="text-center">น้ำหนัก</span>
          <span className="text-right">ถ่วงน้ำหนัก</span>
        </div>

        <ul className="divide-y divide-gray-50">
          {result.rows.map((row) => {
            const colors = getScoreColorClasses(row.score);
            return (
              <li
                key={row.id}
                className="px-4 py-4 transition-colors hover:bg-light-purple/10"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_72px_64px_80px] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {row.label}
                    </p>
                    {row.note && (
                      <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                        {row.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:justify-center">
                    <span className="text-[11px] text-gray-400 sm:hidden">
                      คะแนน
                    </span>
                    <span
                      className={cn(
                        "inline-flex h-9 min-w-9 items-center justify-center rounded-xl border text-sm font-bold",
                        colors.cell,
                        colors.text,
                      )}
                    >
                      {row.score}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-center">
                    <span className="text-[11px] text-gray-400 sm:hidden">
                      น้ำหนัก
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {row.weight}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <span className="text-[11px] text-gray-400 sm:hidden">
                      ถ่วงน้ำหนัก
                    </span>
                    <span className="text-sm font-bold tabular-nums text-primary">
                      {row.weightedScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-4 text-[11px] text-gray-400">
        สูตร: คะแนนถ่วงน้ำหนัก = คะแนน × น้ำหนัก ÷ 5 · คะแนนรวม = ผลรวมทุกเกณฑ์
      </p>
    </Card>
  );
}
