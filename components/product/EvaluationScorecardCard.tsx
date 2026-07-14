"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Textarea } from "@/components/forms/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  cloneEvaluationScorecard,
  computeEvaluationResult,
  EVALUATION_MAX_SCORE,
  getRecommendationBadgeClasses,
  getScoreColorClasses,
  isEvaluationScorecardEqual,
  normalizeEvaluationScorecard,
} from "@/lib/evaluation-scorecard";
import {
  getProductScorecard,
  upsertProductScorecard,
} from "@/lib/services/products";
import { isProductSupabaseEnabled } from "@/lib/services/product-persist";
import { cn, formatDate } from "@/lib/utils";
import type {
  EvaluationCriterionId,
  EvaluationScore,
  ProductEvaluationScorecard,
  ProductView,
} from "@/types/product";

const SCORE_OPTIONS: EvaluationScore[] = [1, 2, 3, 4, 5];

interface EvaluationScorecardCardProps {
  product: ProductView;
  onScorecardSaved?: (scorecard: ProductEvaluationScorecard) => void;
  readOnly?: boolean;
  className?: string;
}

export function EvaluationScorecardCard({
  product,
  onScorecardSaved,
  readOnly = false,
  className,
}: EvaluationScorecardCardProps) {
  const [savedScorecard, setSavedScorecard] =
    useState<ProductEvaluationScorecard>(() =>
      normalizeEvaluationScorecard(product.evaluationScorecard),
    );
  const [draft, setDraft] = useState<ProductEvaluationScorecard>(() =>
    cloneEvaluationScorecard(
      normalizeEvaluationScorecard(product.evaluationScorecard),
    ),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadScorecard() {
      setLoading(true);
      setSaveError(null);

      const fallback = normalizeEvaluationScorecard(
        product.evaluationScorecard,
      );

      if (!isProductSupabaseEnabled()) {
        if (!cancelled) {
          setSavedScorecard(fallback);
          setDraft(cloneEvaluationScorecard(fallback));
          setLoading(false);
        }
        return;
      }

      try {
        const remote = await getProductScorecard(product.id);
        const next = remote ?? fallback;
        if (!cancelled) {
          setSavedScorecard(next);
          setDraft(cloneEvaluationScorecard(next));
          if (remote) onScorecardSaved?.(next);
        }
      } catch {
        if (!cancelled) {
          setSavedScorecard(fallback);
          setDraft(cloneEvaluationScorecard(fallback));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadScorecard();
    return () => {
      cancelled = true;
    };
    // Load once per product id; product.evaluationScorecard is the local fallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const result = useMemo(() => computeEvaluationResult(draft), [draft]);
  const isDirty = !isEvaluationScorecardEqual(draft, savedScorecard);

  function setCriterionScore(id: EvaluationCriterionId, score: EvaluationScore) {
    setDraft((prev) => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [id]: {
          ...prev.criteria[id],
          score,
        },
      },
    }));
    setSaveMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const toSave = normalizeEvaluationScorecard({
      ...draft,
      evaluatedAt: new Date().toISOString(),
    });

    try {
      let saved = toSave;
      if (isProductSupabaseEnabled()) {
        saved = await upsertProductScorecard(product.id, toSave);
      }
      setSavedScorecard(saved);
      setDraft(cloneEvaluationScorecard(saved));
      onScorecardSaved?.(saved);
      setSaveMessage(
        isProductSupabaseEnabled()
          ? "Evaluation saved"
          : "Evaluation saved locally",
      );
    } catch (err) {
      // Graceful fallback: keep local save if Supabase table is missing.
      setSavedScorecard(toSave);
      setDraft(cloneEvaluationScorecard(toSave));
      onScorecardSaved?.(toSave);
      const message =
        err instanceof Error ? err.message : "Failed to save evaluation";
      setSaveError(`${message} · saved locally for now`);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setDraft(cloneEvaluationScorecard(savedScorecard));
    setSaveError(null);
    setSaveMessage(null);
  }

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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                แบบประเมินผลิตภัณฑ์
              </h2>
              {isDirty && (
                <Badge variant="muted">Unsaved changes</Badge>
              )}
              {loading && (
                <span className="text-xs text-gray-400">Loading…</span>
              )}
            </div>
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
            {draft.evaluator || "—"}
          </span>
        </span>
        <span className="text-gray-300">·</span>
        <span>
          วันที่ประเมิน:{" "}
          <span className="font-medium text-gray-700">
            {formatDate(draft.evaluatedAt)}
          </span>
        </span>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-gray-100">
        <div className="hidden grid-cols-[1fr_minmax(180px,220px)_64px_80px] gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 sm:grid">
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
                <div className="grid gap-3 sm:grid-cols-[1fr_minmax(180px,220px)_64px_80px] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {row.label}
                    </p>
                    {row.helpText && (
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        {row.helpText}
                      </p>
                    )}
                    {row.note && (
                      <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                        {row.note}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 sm:items-center">
                    <span className="text-[11px] text-gray-400 sm:hidden">
                      คะแนน
                    </span>
                    <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
                      {SCORE_OPTIONS.map((score) => {
                        const active = row.score === score;
                        return (
                          <button
                            key={`${row.id}-${score}`}
                            type="button"
                            disabled={readOnly}
                            onClick={() => setCriterionScore(row.id, score)}
                            className={cn(
                              "h-8 w-8 rounded-lg text-sm font-bold transition-colors",
                              active
                                ? cn(colors.cell, colors.text)
                                : "text-gray-500 hover:bg-gray-50",
                              readOnly && "cursor-default hover:bg-transparent",
                            )}
                            aria-pressed={active}
                            aria-label={`${row.label} score ${score}`}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>
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
        สูตร: คะแนนถ่วงน้ำหนัก = คะแนน ÷ 5 × น้ำหนัก · คะแนนรวม = ผลรวมทุกเกณฑ์
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Textarea
          label="Overall Comment"
          value={draft.overallComment}
          onChange={(e) => {
            setDraft((prev) => ({ ...prev, overallComment: e.target.value }));
            setSaveMessage(null);
          }}
          rows={3}
          placeholder="สรุปความเห็นโดยรวม"
          readOnly={readOnly}
          disabled={readOnly}
        />
        <Textarea
          label="Next Action / Recommendation"
          value={draft.nextAction}
          onChange={(e) => {
            setDraft((prev) => ({ ...prev, nextAction: e.target.value }));
            setSaveMessage(null);
          }}
          rows={3}
          placeholder="ขั้นตอนถัดไป / คำแนะนำ"
          readOnly={readOnly}
          disabled={readOnly}
        />
      </div>

      {!readOnly && (
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        <Button
          type="button"
          size="sm"
          disabled={!isDirty || saving || loading}
          aria-busy={saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save Evaluation"}
        </Button>
        {isDirty && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={handleReset}
          >
            Discard
          </Button>
        )}
        {saveMessage && (
          <span className="text-xs font-medium text-green-700">
            {saveMessage}
          </span>
        )}
        {saveError && (
          <span className="text-xs font-medium text-fti-red">{saveError}</span>
        )}
      </div>
      )}
    </Card>
  );
}
