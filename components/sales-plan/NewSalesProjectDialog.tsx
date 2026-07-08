"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";

interface NewSalesProjectDialogProps {
  open: boolean;
  creating?: boolean;
  error?: string | null;
  onCancel: () => void;
  onCreate: (input: { name: string; description: string }) => void;
}

export function NewSalesProjectDialog({
  open,
  creating = false,
  error = null,
  onCancel,
  onCreate,
}: NewSalesProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
  }, [open]);

  if (!open) return null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onCreate({ name, description });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-sales-project-title"
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2
          id="new-sales-project-title"
          className="text-lg font-semibold text-gray-900"
        >
          New Sales Plan
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Stored only in this browser. Product data is never modified.
        </p>

        <div className="mt-4 space-y-3">
          <Input
            label="Project Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dealer Campaign Q4"
            autoFocus
            required
          />
          <Textarea
            label="Description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes about this plan"
          />
          {error ? <p className="text-xs text-fti-red">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-shortcut-close
            onClick={onCancel}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={creating || !name.trim()}>
            {creating ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}
