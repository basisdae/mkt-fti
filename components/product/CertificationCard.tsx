import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ProductCertification, Product } from "@/types/product";

interface CertificationCardProps {
  product: Pick<Product, "productSystem">;
  certification: ProductCertification;
}

function IsoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50/80 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

export function CertificationCard({
  product,
  certification: cert,
}: CertificationCardProps) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Certification / Product System
      </h2>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <IsoRow label="ISO 1" value={cert.iso1} />
        <IsoRow label="ISO 2" value={cert.iso2} />
        <IsoRow label="ISO 3" value={cert.iso3} />
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          Regulatory
        </p>
        <div className="flex flex-wrap gap-2">
          {cert.certifications.map((item) => (
            <Badge key={item} variant="default">
              {item}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          Product Systems
        </p>
        <div className="flex flex-wrap gap-2">
          {cert.productSystems.map((system) => (
            <span
              key={system}
              className="rounded-lg bg-light-purple/60 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              {system}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
        <p className="text-xs font-medium text-gray-400">Primary System</p>
        <p className="mt-1 text-sm font-semibold text-gray-900">
          {product.productSystem}
        </p>
      </div>
    </Card>
  );
}
