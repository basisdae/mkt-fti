"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  variant?: "success" | "error";
}

export function Toast({ message, onDismiss, variant = "success" }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-[20px] border px-5 py-4 shadow-lg shadow-gray-200/60",
        variant === "success"
          ? "border-green-200 bg-white"
          : "border-red-200 bg-white",
      )}
    >
      <CheckCircle2
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          variant === "success" ? "text-success" : "text-fti-red",
        )}
      />
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">
          {variant === "success" ? "Product saved" : "Something went wrong"}
        </p>
        <p className="mt-0.5 text-sm text-gray-500">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
