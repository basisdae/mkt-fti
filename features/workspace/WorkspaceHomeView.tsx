"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { MyTasksSection } from "@/components/workspace/MyTasksSection";
import { NeedAttentionSection } from "@/components/workspace/NeedAttentionSection";
import { NotificationsSection } from "@/components/workspace/NotificationsSection";
import { QuickActionsSection } from "@/components/workspace/QuickActionsSection";
import { RecentProductsSection } from "@/components/workspace/RecentProductsSection";
import { RecentSuppliersSection } from "@/components/workspace/RecentSuppliersSection";
import { SalesPlansSection } from "@/components/workspace/SalesPlansSection";
import { SimulatorDraftsSection } from "@/components/workspace/SimulatorDraftsSection";
import { useAuth } from "@/hooks/AuthStore";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { useSupplierStore } from "@/hooks/SupplierStore";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { formatDashboardDate } from "@/lib/dashboard-summary";
import { NOTIFICATION_READS_EVENT } from "@/lib/notifications";
import {
  buildNeedAttention,
  buildRecentProducts,
  buildRecentSuppliers,
  buildSalesPlanItems,
  buildWorkspaceNotifications,
  buildWorkspaceTasks,
  formatWorkspaceGreeting,
  getSimulatorDraftItem,
} from "@/lib/workspace-home";
import { hasPermission } from "@/lib/auth/permissions";

export function WorkspaceHomeView() {
  const { user } = useAuth();
  const products = useLiveProducts();
  const { suppliers } = useSupplierStore();
  const { items: recent } = useRecentlyViewed();
  const [readsVersion, setReadsVersion] = useState(0);
  const [draftTick, setDraftTick] = useState(0);

  useEffect(() => {
    function onReadsChanged() {
      setReadsVersion((value) => value + 1);
    }
    window.addEventListener(NOTIFICATION_READS_EVENT, onReadsChanged);
    window.addEventListener("storage", onReadsChanged);
    return () => {
      window.removeEventListener(NOTIFICATION_READS_EVENT, onReadsChanged);
      window.removeEventListener("storage", onReadsChanged);
    };
  }, []);

  useEffect(() => {
    // Re-read local simulator draft when returning to this tab.
    function onFocus() {
      setDraftTick((value) => value + 1);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const tasks = useMemo(() => buildWorkspaceTasks(products), [products]);
  const attention = useMemo(
    () => buildNeedAttention(products, suppliers),
    [products, suppliers],
  );
  const notifications = useMemo(() => {
    void readsVersion;
    return buildWorkspaceNotifications(products, suppliers);
  }, [products, suppliers, readsVersion]);
  const recentProducts = useMemo(
    () => buildRecentProducts(products, recent),
    [products, recent],
  );
  const recentSuppliers = useMemo(
    () => buildRecentSuppliers(suppliers, recent),
    [suppliers, recent],
  );
  const salesPlans = useMemo(() => buildSalesPlanItems(), [draftTick]);
  const simulatorDraft = useMemo(() => getSimulatorDraftItem(), [draftTick]);

  const greeting = formatWorkspaceGreeting();
  const dateLabel = formatDashboardDate();
  const displayName = user?.displayName?.split(" ")[0] ?? "there";
  const canOpenDashboard = hasPermission(user, "dashboard.view");

  return (
    <div className="page-shell">
      <header className="page-header-block">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
              Workspace Home
            </p>
            <h1 className="page-title mt-2">
              {greeting}, {displayName}
            </h1>
            <p className="page-description mt-2 max-w-2xl">
              Daily work for products, suppliers, plans, and follow-ups — not
              charts.
            </p>
            <p className="mt-2 text-xs font-medium text-gray-400">{dateLabel}</p>
          </div>
          {canOpenDashboard && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-primary/25 hover:bg-light-purple/40 hover:text-primary sm:self-auto"
            >
              <LayoutDashboard className="h-4 w-4" />
              Analytics dashboard
            </Link>
          )}
        </div>
      </header>

      <div className="space-y-4 lg:space-y-5">
        <QuickActionsSection />

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <MyTasksSection tasks={tasks} />
          <NeedAttentionSection items={attention} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <RecentProductsSection items={recentProducts} />
          <RecentSuppliersSection items={recentSuppliers} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <SimulatorDraftsSection item={simulatorDraft.item} />
          <SalesPlansSection items={salesPlans} />
        </div>

        <NotificationsSection items={notifications} />
      </div>
    </div>
  );
}
