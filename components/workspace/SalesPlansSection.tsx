"use client";

import { FileSpreadsheet } from "lucide-react";
import {
  WorkspaceEmpty,
  WorkspaceSection,
} from "@/components/workspace/WorkspaceSection";
import { WorkspaceListRow } from "@/components/workspace/WorkspaceListRow";
import type { WorkspaceListItem } from "@/lib/workspace-home";

interface SalesPlansSectionProps {
  items: WorkspaceListItem[];
}

export function SalesPlansSection({ items }: SalesPlansSectionProps) {
  return (
    <WorkspaceSection
      title="Sales Plans"
      description="Local sales plan projects"
      href="/simulator"
    >
      {items.length === 0 ? (
        <WorkspaceEmpty message="No sales plans saved yet." />
      ) : (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <WorkspaceListRow
                href={item.href}
                title={item.title}
                subtitle={item.subtitle}
                meta={item.meta}
                leading={<FileSpreadsheet className="h-4 w-4" />}
                toneClassName="bg-emerald-50 text-emerald-700"
              />
            </li>
          ))}
        </ul>
      )}
    </WorkspaceSection>
  );
}
