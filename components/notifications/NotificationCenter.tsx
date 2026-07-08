"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Inbox,
} from "lucide-react";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { useSupplierStore } from "@/hooks/SupplierStore";
import {
  buildNotifications,
  formatNotificationTime,
  getNotificationReads,
  isNotificationRead,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_READS_EVENT,
  type AppNotification,
  type NotificationLevel,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

type FilterKey = "all" | NotificationLevel;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "info", label: "Info" },
  { key: "warning", label: "Warning" },
  { key: "success", label: "Success" },
];

const LEVEL_META: Record<
  NotificationLevel,
  { icon: typeof Info; className: string; label: string }
> = {
  info: {
    icon: Info,
    className: "bg-sky-50 text-sky-700",
    label: "Info",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-amber-50 text-amber-700",
    label: "Warning",
  },
  success: {
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700",
    label: "Success",
  },
};

export function NotificationCenter() {
  const router = useRouter();
  const products = useLiveProducts();
  const { suppliers } = useSupplierStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [readsVersion, setReadsVersion] = useState(0);

  const refreshReads = useCallback(() => {
    setReadsVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    function onReadsChanged() {
      refreshReads();
    }
    window.addEventListener(NOTIFICATION_READS_EVENT, onReadsChanged);
    window.addEventListener("storage", onReadsChanged);
    return () => {
      window.removeEventListener(NOTIFICATION_READS_EVENT, onReadsChanged);
      window.removeEventListener("storage", onReadsChanged);
    };
  }, [refreshReads]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const notifications = useMemo(
    () => buildNotifications(products, suppliers),
    [products, suppliers],
  );

  const reads = useMemo(() => {
    void readsVersion;
    return getNotificationReads();
  }, [readsVersion]);

  const withReadState = useMemo(
    () =>
      notifications.map((item) => ({
        ...item,
        read: isNotificationRead(item, reads),
      })),
    [notifications, reads],
  );

  const unreadCount = useMemo(
    () => withReadState.filter((item) => !item.read).length,
    [withReadState],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return withReadState;
    return withReadState.filter((item) => item.level === filter);
  }, [withReadState, filter]);

  function handleMarkAllRead() {
    markAllNotificationsRead();
    refreshReads();
  }

  function handleOpenItem(item: AppNotification & { read: boolean }) {
    if (!item.read) {
      markNotificationRead(item.id);
      refreshReads();
    }
    if (item.href) {
      setOpen(false);
      router.push(item.href);
    }
  }

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative rounded-xl p-2 text-gray-500 transition-colors",
          "hover:bg-gray-100 hover:text-gray-900",
          open && "bg-gray-100 text-gray-900",
        )}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {badgeLabel && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Notification center"
          className="absolute right-0 top-full z-[120] mt-2 flex w-[min(100vw-1.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/70 sm:w-[24rem]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Notifications
              </h2>
              <p className="mt-0.5 text-[11px] text-gray-400">
                Read-only feed from current workspace data
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="shrink-0 text-xs font-semibold text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              Mark all read
            </button>
          </div>

          <div className="flex gap-1 border-b border-gray-100 px-3 py-2">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  filter === item.key
                    ? "bg-primary text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <ul className="max-h-[min(70vh,24rem)] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Inbox className="h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">
                  No notifications
                </p>
                <p className="text-xs text-gray-400">
                  Nothing matches this filter right now.
                </p>
              </li>
            ) : (
              filtered.map((item) => {
                const meta = LEVEL_META[item.level];
                const Icon = meta.icon;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenItem(item)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                        !item.read && "bg-primary/[0.03]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                          meta.className,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {item.title}
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <span className="text-[10px] font-medium text-gray-400">
                              {formatNotificationTime(item.createdAt)}
                            </span>
                            {!item.read && (
                              <span
                                className="h-2 w-2 rounded-full bg-primary"
                                aria-label="Unread"
                              />
                            )}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                          {item.body}
                        </span>
                        <span className="mt-1 inline-flex rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          {meta.label}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
