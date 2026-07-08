"use client";

import { AlertTriangle } from "lucide-react";
import {
  WorkspaceEmpty,
  WorkspaceSection,
} from "@/components/workspace/WorkspaceSection";
import { WorkspaceListRow } from "@/components/workspace/WorkspaceListRow";
import type { WorkspaceAttentionItem } from "@/lib/workspace-home";

interface NeedAttentionSectionProps {
  items: WorkspaceAttentionItem[];
}

export function NeedAttentionSection({ items }: NeedAttentionSectionProps) {
  return (
    <WorkspaceSection
      title="Need Attention"
      description="Missing images, certificates, or resume data"
      href="/products"
    >
      {items.length === 0 ? (
        <WorkspaceEmpty message="Nothing needs attention." />
      ) : (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <WorkspaceListRow
                href={item.href}
                title={item.title}
                subtitle={item.detail}
                leading={<AlertTriangle className="h-4 w-4" />}
                toneClassName="bg-amber-50 text-amber-700"
              />
            </li>
          ))}
        </ul>
      )}
    </WorkspaceSection>
  );
}
