"use client";

import { Redo2, Undo2 } from "lucide-react";
import { SIMULATOR_COPY as t } from "@/lib/simulator-i18n";
import { cn } from "@/lib/utils";

interface SimulatorUndoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function SimulatorUndoToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: SimulatorUndoToolbarProps) {
  return (
    <div
      className="fixed right-4 top-[4.5rem] z-30 flex items-center gap-1 rounded-full border border-gray-200/90 bg-card/95 p-1 shadow-lg shadow-gray-200/50 backdrop-blur-sm transition-opacity sm:right-6"
      role="toolbar"
      aria-label={t.undoRedoToolbar}
    >
      <ToolbarButton
        label={t.undo}
        shortcut={t.undoShortcut}
        disabled={!canUndo}
        onClick={onUndo}
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-0.5 h-5 w-px bg-gray-200" aria-hidden />
      <ToolbarButton
        label={t.redo}
        shortcut={t.redoShortcut}
        disabled={!canRedo}
        onClick={onRedo}
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  shortcut,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  shortcut: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={`${label} (${shortcut})`}
      aria-label={`${label} (${shortcut})`}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-all duration-150",
        disabled
          ? "cursor-not-allowed opacity-35"
          : "hover:bg-light-purple/70 hover:text-primary active:scale-95",
      )}
    >
      {children}
    </button>
  );
}
