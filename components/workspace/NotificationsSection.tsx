"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  WorkspaceEmpty,
  WorkspaceSection,
} from "@/components/workspace/WorkspaceSection";
import { WorkspaceListRow } from "@/components/workspace/WorkspaceListRow";
import {
  formatNotificationTime,
  type AppNotification,
  type NotificationLevel,
} from "@/lib/notifications";

interface NotificationsSectionProps {
  items: (AppNotification & { read: boolean })[];
}

const LEVEL_ICON: Record<
  NotificationLevel,
  { icon: typeof Info; className: string }
> = {
  info: { icon: Info, className: "bg-sky-50 text-sky-700" },
  warning: { icon: AlertTriangle, className: "bg-amber-50 text-amber-700" },
  success: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700" },
};

export function NotificationsSection({ items }: NotificationsSectionProps) {
  return (
    <WorkspaceSection
      title="Notifications"
      description="Read-only feed from workspace data"
    >
      {items.length === 0 ? (
        <WorkspaceEmpty message="No notifications." />
      ) : (
        <ul className="space-y-0.5">
          {items.map((item) => {
            const meta = LEVEL_ICON[item.level];
            const Icon = meta.icon;
            return (
              <li key={item.id}>
                <WorkspaceListRow
                  href={item.href ?? "/products"}
                  title={item.title}
                  subtitle={item.body}
                  meta={formatNotificationTime(item.createdAt)}
                  unread={!item.read}
                  leading={<Icon className="h-4 w-4" />}
                  toneClassName={meta.className}
                />
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-1 flex items-center justify-center gap-1.5 px-3 pb-2 text-[11px] text-gray-400">
        <Bell className="h-3.5 w-3.5" />
        Use the header bell for filters and mark all read
      </div>
    </WorkspaceSection>
  );
}
