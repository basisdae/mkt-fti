import { Card } from "@/components/ui/Card";
import { Input } from "@/components/forms/Input";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="page-shell">
      <div className="page-header-block">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">
          Configure workspace preferences and display options.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card interactive>
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            General
          </h2>
          <div className="space-y-4">
            <Input label="Workspace Name" defaultValue="MKT-FTI" readOnly />
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
