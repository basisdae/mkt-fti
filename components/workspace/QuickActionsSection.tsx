"use client";

import Link from "next/link";
import {
  Calculator,
  Factory,
  FileSpreadsheet,
  Package,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/AuthStore";
import {
  canCreateProducts,
  canCreateSuppliers,
  hasPermission,
} from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: typeof Package;
  visible: boolean;
}

export function QuickActionsSection() {
  const { user } = useAuth();

  const actions: QuickAction[] = [
    {
      id: "product",
      label: "+ Product",
      href: "/products/new",
      icon: Package,
      visible: canCreateProducts(user),
    },
    {
      id: "supplier",
      label: "+ Supplier",
      href: "/suppliers/new",
      icon: Factory,
      visible: canCreateSuppliers(user),
    },
    {
      id: "sales-plan",
      label: "+ Sales Plan",
      href: "/simulator",
      icon: Calculator,
      visible: hasPermission(user, "simulator.view"),
    },
    {
      id: "resume",
      label: "+ Resume",
      href:
        hasPermission(user, "rnd.view") ||
        hasPermission(user, "rnd.edit_spec")
          ? "/rnd/specs"
          : "/products",
      icon: FileSpreadsheet,
      visible:
        hasPermission(user, "rnd.view") ||
        hasPermission(user, "rnd.edit_spec") ||
        hasPermission(user, "products.view"),
    },
    {
      id: "import",
      label: "+ Import",
      href: "/products/import",
      icon: Upload,
      visible: canCreateProducts(user),
    },
  ];

  const visible = actions.filter((action) => action.visible);
  if (visible.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-200/40 sm:p-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Start common daily work in one click
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-semibold text-gray-800 transition-all",
                "hover:border-primary/30 hover:bg-light-purple/50 hover:text-primary",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
