"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";

interface SeminarAgendaClearDialogProps {
  open: boolean;
  sessionCount: number;
  clearing?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function SeminarAgendaClearDialog({
  open,
  sessionCount,
  clearing = false,
  error = null,
  onClose,
  onConfirm,
}: SeminarAgendaClearDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.clearAgendaDialogTitle}
      disableClose={clearing}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={clearing}
            autoFocus
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={clearing}
          >
            {clearing ? t.clearingAgenda : t.clearAgendaConfirm}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-gray-600">
          {t.clearAgendaDialogBody(sessionCount)}
        </p>
        {error ? <p className="text-sm text-fti-red">{error}</p> : null}
      </div>
    </Modal>
  );
}
