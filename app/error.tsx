"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("MKT HQ page error", error);
  }, [error]);

  return (
    <div className="page-shell flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <h1 className="page-title mt-4">This page couldn&apos;t load</h1>
      <p className="page-description mt-2 max-w-md">
        {error.message?.trim() ||
          "Something went wrong while rendering this page."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="secondary" onClick={() => reset()}>
          Reload
        </Button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
