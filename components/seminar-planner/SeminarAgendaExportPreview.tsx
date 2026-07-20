"use client";

import { FileDown, Printer, X } from "lucide-react";
import { SeminarAgendaTimelineDocument } from "@/components/seminar-planner/SeminarAgendaTimelineDocument";
import { Button } from "@/components/ui/Button";
import {
  buildSeminarAgendaDocument,
  seminarAgendaDocumentPrintTitle,
} from "@/lib/seminar-agenda-document";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";
import type {
  SeminarAgendaItemInput,
  SeminarEventRow,
} from "@/types/seminar-planner";

export interface SeminarAgendaExportPreviewProps {
  open: boolean;
  event: Pick<
    SeminarEventRow,
    "title" | "start_date" | "end_date" | "venue" | "event_format"
  > | null;
  items: SeminarAgendaItemInput[];
  categoryColorHints?: Record<string, string>;
  onClose: () => void;
}

export function SeminarAgendaExportPreview({
  open,
  event,
  items,
  categoryColorHints,
  onClose,
}: SeminarAgendaExportPreviewProps) {
  if (!open || !event) return null;

  const model = buildSeminarAgendaDocument({
    event,
    items,
    categoryColorHints,
  });

  function handlePrint() {
    const previousTitle = document.title;
    document.title = seminarAgendaDocumentPrintTitle(model);
    window.print();
    document.title = previousTitle;
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/50 p-4 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="mx-auto max-w-[220mm] rounded-2xl border border-gray-100 bg-gray-100 shadow-xl print:max-w-none print:rounded-none print:border-0 print:bg-white print:shadow-none">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 print:hidden">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t.agendaDocumentPreviewTitle}
            </h2>
            <p className="text-sm text-gray-500">{t.agendaDocumentPreviewSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              {t.agendaDocumentPrintPdf}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 print:p-0">
          <SeminarAgendaTimelineDocument model={model} />
        </div>

        <div className="border-t border-gray-100 bg-white px-5 py-3 text-xs text-gray-500 print:hidden">
          <FileDown className="mr-1 inline h-3.5 w-3.5" />
          {t.agendaDocumentPrintHint}
        </div>
      </div>
    </div>
  );
}
