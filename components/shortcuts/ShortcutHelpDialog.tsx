"use client";

import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KEYBOARD_SHORTCUTS } from "@/lib/keyboard-shortcuts";

interface ShortcutHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutHelpDialog({ open, onClose }: ShortcutHelpDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-shortcut-dialog="help"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-help-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="shortcut-help-title"
              className="text-lg font-semibold text-gray-900"
            >
              Keyboard shortcuts
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Shortcuts are disabled while typing in fields.
            </p>
          </div>
        </div>

        <ul className="divide-y divide-gray-100 px-5 py-2">
          {KEYBOARD_SHORTCUTS.map((item) => (
            <li
              key={item.keys}
              className="flex items-center justify-between gap-4 py-2.5"
            >
              <span className="text-sm text-gray-700">{item.action}</span>
              <kbd className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600">
                {item.keys}
              </kbd>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-100 px-5 py-3 text-right">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-shortcut-close
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
