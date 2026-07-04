"use client";

import Link from "next/link";
import { Shield, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/forms/Input";
import { Button } from "@/components/ui/Button";
import { ExchangeRateSettings } from "@/features/settings/ExchangeRateSettings";
import { useAuth } from "@/hooks/AuthStore";
import { canManageUsers } from "@/lib/auth/permissions";

export function SettingsPageView() {
  const { user } = useAuth();
  const showManageUsers = canManageUsers(user);

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">
          Configure workspace preferences and display options.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {showManageUsers && (
          <Link href="/settings/users" className="block">
            <Card
              interactive
              className="border-primary/15 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">
                      Manage Users
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-light-purple px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Create accounts, assign roles, reset passwords, and activate
                    or deactivate users.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        <ExchangeRateSettings />

        <Card interactive>
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            General
          </h2>
          <div className="space-y-4">
            <Input
              label="Workspace Name"
              defaultValue="MKT Headquarter"
              readOnly
            />
            <Input label="Default Currency" defaultValue="THB" readOnly />
            <Input label="Fiscal Year Start" defaultValue="January" readOnly />
          </div>
        </Card>

        <Card interactive>
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Notifications
          </h2>
          <div className="space-y-3">
            {[
              "Product status changes",
              "Quotation received",
              "Launch date reminders",
              "Pipeline stage updates",
            ].map((item) => (
              <label
                key={item}
                className="flex cursor-default items-center justify-between rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100/80"
              >
                <span className="text-sm text-gray-700">{item}</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded accent-primary"
                  readOnly
                />
              </label>
            ))}
          </div>
          <Button type="button" className="mt-4" variant="secondary">
            Save Preferences
          </Button>
        </Card>
      </div>
    </div>
  );
}
