"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";

interface RenameSalesProjectDialogProps {
  open: boolean;
  currentName: string;
  error?: string | null;
  onCancel: () => void;
  onRename: (name: string) => void;
}

export function RenameSalesProjectDialog({
  open,
  currentName,
  error = null,
  onCancel,
  onRename,
}: RenameSalesProjectDialogProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-sales-project-title"
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onRename(name);
        }}
      >
        <h2
          id="rename-sales-project-title"
          className="text-lg font-semibold text-gray-900"
        >
          Rename Project
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Renames the project only. Scenario data is unchanged.
        </p>

        <div className="mt-4">
          <Input
            label="Project Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          {error ? (
            <p className="mt-2 text-xs text-fti-red">{error}</p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-shortcut-close
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!name.trim()}>
            Rename
          </Button>
        </div>
      </form>
    </div>
  );
}
