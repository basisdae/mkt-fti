"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  formatSeminarReplaceLibraryDialogMessage,
  SEMINAR_PLANNER_COPY as t,
} from "@/lib/seminar-planner-i18n";

export interface SeminarAgendaReplaceLibraryTarget {
  index: number;
  fromTitle: string;
  toTitle: string;
  needsOverwriteWarning?: boolean;
}

interface SeminarAgendaReplaceLibraryDialogProps {
  target: SeminarAgendaReplaceLibraryTarget | null;
  replacing?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function SeminarAgendaReplaceLibraryDialog({
  target,
  replacing = false,
  error = null,
  onClose,
  onConfirm,
}: SeminarAgendaReplaceLibraryDialogProps) {
  return (
    <Modal
      open={target != null}
      onClose={onClose}
      title={t.replaceDialogTitle}
      disableClose={replacing}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={replacing}
            autoFocus
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={replacing}
          >
            {replacing ? t.replacingSession : t.replaceDialogConfirm}
          </Button>
        </div>
      }
    >
      {target ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-600">
            {formatSeminarReplaceLibraryDialogMessage(
              target.fromTitle,
              target.toTitle,
              target.needsOverwriteWarning,
            )}
          </p>
          {error ? <p className="text-sm text-fti-red">{error}</p> : null}
        </div>
      ) : null}
    </Modal>
  );
}
