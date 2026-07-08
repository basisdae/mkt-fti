"use client";

import { useState } from "react";
import { Download, HardDriveDownload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { exportFullDataBackup } from "@/lib/data-backup-export";

export function DataBackupSettings() {
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportFullDataBackup();
      const totalRows = Object.values(result.sheetCounts).reduce(
        (sum, count) => sum + count,
        0,
      );
      const warnNote =
        result.warnings.length > 0
          ? ` (${result.warnings.length} table warning(s) — see _warnings sheet)`
          : "";
      setToast({
        title: "Backup ready",
        message: `Downloaded ${result.fileName} · ${totalRows.toLocaleString()} rows${warnNote}`,
        variant: "success",
      });
    } catch (err) {
      setToast({
        title: "Backup failed",
        message:
          err instanceof Error
            ? err.message
            : "Could not export backup. Please try again.",
        variant: "error",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HardDriveDownload className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900">
              Data Backup
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Download a read-only Excel snapshot of products, suppliers, MOQ
              prices, image metadata, tag links, and local Sales Plan Projects.
              Does not change any records. Image files are not included — only
              URLs/metadata.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              disabled={exporting}
              onClick={() => void handleExport()}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting…" : "Export All Data"}
            </Button>
            <p className="mt-2 text-[11px] text-gray-400">
              File: MKT_HQ_Backup_YYYYMMDD_HHMM.xlsx
            </p>
          </div>
        </div>
      </Card>

      {toast && (
        <Toast
          title={toast.title}
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
