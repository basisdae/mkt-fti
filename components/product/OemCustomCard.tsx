import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ProductCustomOptions, Product } from "@/types/product";

interface OemCustomCardProps {
  product: Pick<Product, "businessType" | "oemType">;
  customOptions: ProductCustomOptions;
}

function FlagRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50/80 px-4 py-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
          value
            ? "bg-light-purple text-primary"
            : "bg-gray-100 text-gray-400",
        )}
      >
        {value ? "Yes" : "No"}
      </span>
    </div>
  );
}

export function OemCustomCard({ product, customOptions: opts }: OemCustomCardProps) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        OEM / ODM / Custom
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <FlagRow label="OEM" value={opts.oem} />
        <FlagRow label="ODM" value={opts.odm} />
        <FlagRow label="Private Label" value={opts.privateLabel} />
        <FlagRow label="Packaging" value={opts.packagingCustom} />
        <FlagRow label="Color Custom" value={opts.colorCustom} />
        <FlagRow label="Spec Custom" value={opts.specCustom} />
        <FlagRow label="Exclusive" value={opts.exclusive} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50/80 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Custom Level
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {opts.customLevel}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50/80 px-4 py-3 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Business Type
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {product.businessType}
          </p>
        </div>
      </div>
      {opts.customNotes && (
        <div className="mt-3 rounded-xl bg-light-purple/30 px-4 py-3">
          <p className="text-xs font-medium text-gray-500">Notes</p>
          <p className="mt-1 text-sm text-gray-700">{opts.customNotes}</p>
        </div>
      )}
    </Card>
  );
}
