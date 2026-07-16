"use client";

import type { GiftPlanEditorWarning } from "@/lib/gift-plan-editor-warnings";
import { cn } from "@/lib/utils";

interface GiftPlanEditorWarningsProps {
  warnings: GiftPlanEditorWarning[];
}

export function GiftPlanEditorWarnings({ warnings }: GiftPlanEditorWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <ul className="space-y-2">
      {warnings.map((warning) => (
        <li
          key={warning.id}
          className={cn(
            "rounded-xl px-3 py-2 text-xs",
            warning.severity === "error" && "bg-red-50 text-fti-red",
            warning.severity === "warning" && "bg-amber-50 text-amber-800",
            warning.severity === "info" && "bg-gray-50 text-gray-600",
          )}
        >
          {warning.message}
        </li>
      ))}
    </ul>
  );
}
