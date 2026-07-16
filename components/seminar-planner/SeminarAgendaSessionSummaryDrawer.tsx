"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { normalizeBullets } from "@/lib/seminar-planner-bullets";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type { SeminarAgendaItemInput } from "@/types/seminar-planner";

interface SeminarAgendaSessionSummaryDrawerProps {
  open: boolean;
  item: SeminarAgendaItemInput | null;
  onClose: () => void;
}

function BulletReadList({
  label,
  bullets,
}: {
  label: string;
  bullets: ReturnType<typeof normalizeBullets>;
}) {
  if (bullets.length === 0) {
    return (
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </h4>
        <p className="mt-2 text-sm text-gray-400">—</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
        {bullets.map((bullet) => (
          <li key={bullet.id}>{bullet.text}</li>
        ))}
      </ul>
    </div>
  );
}

export function SeminarAgendaSessionSummaryDrawer({
  open,
  item,
  onClose,
}: SeminarAgendaSessionSummaryDrawerProps) {
  if (!item) return null;

  const details = normalizeBullets(item.detail_bullets);
  const objectives = normalizeBullets(item.objectives_bullets);
  const outcomes = normalizeBullets(item.outcomes_bullets);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item.title?.trim() || t.sessionTitle}
      className="max-w-lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t.closeSummary}
          </Button>
          <Link
            href="/seminars/library"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <ExternalLink className="h-4 w-4" />
            {t.editInLibrary}
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-gray-400">{t.category}</dt>
            <dd className="font-medium text-gray-800">
              {item.category_name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">{t.format}</dt>
            <dd className="font-medium text-gray-800">
              {item.format_name || "—"}
            </dd>
          </div>
          {item.target_group_names && item.target_group_names.length > 0 ? (
            <div className="col-span-2">
              <dt className="text-xs text-gray-400">{t.targetGroupsLabel}</dt>
              <dd className="mt-1 font-medium text-gray-800">
                {item.target_group_names.join(", ")}
              </dd>
            </div>
          ) : null}
        </dl>

        <BulletReadList label={t.detailBullets} bullets={details} />
        <BulletReadList label={t.objectivesBullets} bullets={objectives} />
        <BulletReadList label={t.outcomesBullets} bullets={outcomes} />

        {item.library_session_id ? (
          <p className="text-xs text-gray-500">{t.agendaSnapshotHint}</p>
        ) : (
          <p className="text-xs text-gray-500">{t.customSessionSummaryHint}</p>
        )}
      </div>
    </Modal>
  );
}
