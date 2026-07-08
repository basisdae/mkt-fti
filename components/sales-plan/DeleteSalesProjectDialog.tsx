"use client";

import { Button } from "@/components/ui/Button";

interface DeleteSalesProjectDialogProps {
  open: boolean;
  projectName: string;
  deleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteSalesProjectDialog({
  open,
  projectName,
  deleting = false,
  onCancel,
  onConfirm,
}: DeleteSalesProjectDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-sales-project-title"
        className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="delete-sales-project-title"
          className="text-lg font-semibold text-gray-900"
        >
          Delete Sales Plan Project?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          <span className="font-semibold text-gray-900">{projectName}</span>{" "}
          will be removed from this browser only.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Product and supplier records are not affected. This cannot be undone.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-shortcut-close
            disabled={deleting}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Deleting…" : "Delete Project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
