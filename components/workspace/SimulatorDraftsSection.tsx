"use client";

import { Calculator } from "lucide-react";
import {
  WorkspaceEmpty,
  WorkspaceSection,
} from "@/components/workspace/WorkspaceSection";
import { WorkspaceListRow } from "@/components/workspace/WorkspaceListRow";
import type { WorkspaceListItem } from "@/lib/workspace-home";

interface SimulatorDraftsSectionProps {
  item: WorkspaceListItem | null;
}

export function SimulatorDraftsSection({ item }: SimulatorDraftsSectionProps) {
  return (
    <WorkspaceSection
      title="Simulator Drafts"
      description="Autosaved draft for an open project"
      href="/simulator"
      actionLabel="Projects"
    >
      {!item ? (
        <WorkspaceEmpty message="No simulator draft saved." />
      ) : (
        <WorkspaceListRow
          href={item.href}
          title={item.title}
          subtitle={item.subtitle}
          meta={item.meta}
          leading={<Calculator className="h-4 w-4" />}
          toneClassName="bg-violet-50 text-violet-700"
        />
      )}
    </WorkspaceSection>
  );
}
