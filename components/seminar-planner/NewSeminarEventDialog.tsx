"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";

export interface NewSeminarEventInput {
  title: string;
  event_type?: string;
}

interface NewSeminarEventDialogProps {
  open: boolean;
  creating?: boolean;
  error?: string | null;
  onCancel: () => void;
  onCreate: (input: NewSeminarEventInput) => void;
}

export function NewSeminarEventDialog({
  open,
  creating = false,
  error = null,
  onCancel,
  onCreate,
}: NewSeminarEventDialogProps) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setEventType("");
  }, [open]);

  if (!open) return null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onCreate({
      title: title.trim(),
      event_type: eventType.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold text-gray-900">{t.newEventTitle}</h2>
        <p className="mt-1 text-sm text-gray-500">{t.newEventSubtitle}</p>
        <div className="mt-4 space-y-3">
          <Input
            label={t.eventTitleLabel}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.eventTitlePlaceholder}
            autoFocus
            required
          />
          <Input
            label={t.eventTypeLabel}
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder={t.eventTypePlaceholder}
          />
          {error ? <p className="text-xs text-fti-red">{error}</p> : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button type="submit" disabled={creating || !title.trim()}>
            {creating ? t.creating : t.createEvent}
          </Button>
        </div>
      </form>
    </div>
  );
}
