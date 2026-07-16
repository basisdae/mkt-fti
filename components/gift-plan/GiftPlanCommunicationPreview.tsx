"use client";

import { FileDown, Printer, X } from "lucide-react";
import "./gift-plan-communication-print.css";
import { Button } from "@/components/ui/Button";
import { formatGiftMoney } from "@/lib/gift-plan-format";
import {
  communicationPrintTitle,
  downloadCommunicationExport,
  exportCommunicationWorkbook,
  formatCommunicationGeneratedLabel,
} from "@/lib/gift-plan-communication-export";
import type { GiftPlanCommunicationReport } from "@/types/gift-plan";

interface GiftPlanCommunicationPreviewProps {
  open: boolean;
  report: GiftPlanCommunicationReport | null;
  onClose: () => void;
}

export function GiftPlanCommunicationPreview({
  open,
  report,
  onClose,
}: GiftPlanCommunicationPreviewProps) {
  if (!open || !report) return null;

  async function handleExportExcel() {
    const exported = await exportCommunicationWorkbook(report!);
    downloadCommunicationExport(exported.buffer, exported.fileName);
  }

  function handlePrint() {
    const previousTitle = document.title;
    document.title = communicationPrintTitle(report!);
    window.print();
    document.title = previousTitle;
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/50 p-4 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-100 bg-white shadow-xl print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 print:hidden">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Sales Communication Report
            </h2>
            <p className="text-sm text-gray-500">
              Read-only preview for sales teams and graphic production
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => void handleExportExcel()}>
              <FileDown className="h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print / PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <article id="gift-plan-communication-print" className="communication-report px-6 py-8 print:px-10 print:py-10">
          <header className="border-b border-gray-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Customer Gift Rights
            </p>
            {report.campaign_headline ? (
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                {report.campaign_headline}
              </h1>
            ) : null}
            <h2 className="mt-2 text-xl font-medium text-gray-800">
              {report.campaign_name}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Campaign Year {report.campaign_year}
            </p>
            {report.campaign_description ? (
              <p className="mt-4 text-sm leading-relaxed text-gray-700">
                {report.campaign_description}
              </p>
            ) : null}
          </header>

          <div className="mt-8 space-y-8">
            {report.tiers.map((tier) => (
              <section
                key={tier.id}
                className="communication-tier-card break-inside-avoid rounded-2xl border border-gray-200 bg-gray-50 p-5 print:break-inside-avoid print:rounded-xl print:border-gray-300 print:bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">
                      Tier {tier.name}
                    </h3>
                    {tier.sales_threshold_label ? (
                      <p className="mt-2 text-lg font-medium text-primary">
                        ยอดซื้อสะสม {tier.sales_threshold_label}
                      </p>
                    ) : null}
                  </div>
                  {tier.tier_voucher_value != null ? (
                    <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm print:border print:border-gray-200">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Voucher Value
                      </p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatGiftMoney(tier.tier_voucher_value)} บาท
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-gray-800">ได้รับ:</p>
                  <ul className="mt-3 space-y-2">
                    {tier.items.map((item, index) => (
                      <li
                        key={`${tier.id}-${index}`}
                        className="flex items-start justify-between gap-4 text-sm text-gray-700"
                      >
                        <span>• {item.display_line}</span>
                        {item.voucher_value != null ? (
                          <span className="shrink-0 font-medium">
                            {formatGiftMoney(item.voucher_value)} บาท
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-5 text-base font-semibold text-gray-900">
                  มูลค่าของขวัญรวม{" "}
                  {formatGiftMoney(tier.total_estimated_value_per_customer)} บาท
                  <span className="ml-1 text-sm font-normal text-gray-500">
                    ต่อลูกค้า
                  </span>
                </p>

                {tier.gift_policy ? (
                  <p className="mt-4 text-sm text-gray-600">
                    <span className="font-medium text-gray-800">Gift Policy: </span>
                    {tier.gift_policy}
                  </p>
                ) : null}

                {tier.public_conditions ? (
                  <div className="mt-4 rounded-xl bg-white p-4 text-sm text-gray-600 print:border print:border-gray-200">
                    <p className="font-medium text-gray-800">เงื่อนไข / Notes</p>
                    <p className="mt-2 whitespace-pre-wrap">{tier.public_conditions}</p>
                  </div>
                ) : null}
              </section>
            ))}
          </div>

          {report.campaign_conditions ? (
            <footer className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-600">
              <p className="font-medium text-gray-800">Campaign Conditions</p>
              <p className="mt-2 whitespace-pre-wrap">{report.campaign_conditions}</p>
            </footer>
          ) : null}

          <p className="mt-8 text-xs text-gray-400 print:mt-10">
            Generated {formatCommunicationGeneratedLabel(report.generated_at)}
          </p>
        </article>
      </div>
    </div>
  );
}
