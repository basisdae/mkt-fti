"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Blocks Escape, backdrop click, and header close button. */
  disableClose?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  bodyClassName,
  disableClose = false,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || disableClose) return;
      onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, disableClose]);

  if (!open) return null;

  function handleBackdropClose() {
    if (disableClose) return;
    onClose();
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center overflow-hidden p-4",
        "pb-[max(1rem,env(safe-area-inset-bottom))]",
        "sm:items-center",
      )}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px]"
        onClick={handleBackdropClose}
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-[20px] border border-gray-100 bg-card shadow-xl shadow-gray-200/60",
          "max-h-[calc(100dvh-32px)]",
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-card px-5 py-4">
          <h2 id={titleId} className="pr-4 text-base font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (disableClose) return;
              onClose();
            }}
            disabled={disableClose}
            aria-label="Close modal"
            className={cn(
              "rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600",
              disableClose && "cursor-not-allowed opacity-40",
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4",
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-gray-100 bg-card px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
