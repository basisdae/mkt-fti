"use client";

import { CheckSquare, CircleAlert, Info } from "lucide-react";
import {
  WorkspaceEmpty,
  WorkspaceSection,
} from "@/components/workspace/WorkspaceSection";
import { WorkspaceListRow } from "@/components/workspace/WorkspaceListRow";
import type { WorkspaceTask } from "@/lib/workspace-home";

interface MyTasksSectionProps {
  tasks: WorkspaceTask[];
}

export function MyTasksSection({ tasks }: MyTasksSectionProps) {
  return (
    <WorkspaceSection
      title="My Tasks"
      description="Gaps and follow-ups from your catalog"
      href="/pipeline"
      actionLabel="Pipeline"
    >
      {tasks.length === 0 ? (
        <WorkspaceEmpty message="No open tasks right now." />
      ) : (
        <ul className="space-y-0.5">
          {tasks.map((task) => (
            <li key={task.id}>
              <WorkspaceListRow
                href={task.href}
                title={task.title}
                subtitle={task.detail}
                leading={
                  task.tone === "warning" ? (
                    <CircleAlert className="h-4 w-4" />
                  ) : task.tone === "info" ? (
                    <Info className="h-4 w-4" />
                  ) : (
                    <CheckSquare className="h-4 w-4" />
                  )
                }
                toneClassName={
                  task.tone === "warning"
                    ? "bg-amber-50 text-amber-700"
                    : task.tone === "info"
                      ? "bg-sky-50 text-sky-700"
                      : "bg-gray-50 text-gray-500"
                }
              />
            </li>
          ))}
        </ul>
      )}
    </WorkspaceSection>
  );
}
