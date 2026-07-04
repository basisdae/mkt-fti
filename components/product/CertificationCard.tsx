import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  getIsoCertifications,
  getRegulatoryCertifications,
  hasIsoCertifications,
  hasRegulatoryCertifications,
  normalizeProductCertification,
} from "@/lib/product-certification";
import type { ProductCertification, Product } from "@/types/product";

interface CertificationCardProps {
  product: Pick<Product, "productSystem">;
  certification: ProductCertification;
}

export function CertificationCard({
  product,
  certification,
}: CertificationCardProps) {
  const cert = normalizeProductCertification(certification);
  const isoList = getIsoCertifications(cert);
  const hasIso = hasIsoCertifications(cert);
  const regulatoryCerts = getRegulatoryCertifications(cert);
  const hasCerts = hasRegulatoryCertifications(cert);
  const productSystems = cert.productSystems.filter((system) => system.trim());
  const primarySystem = product.productSystem?.trim();

  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        Certification / Product System
      </h2>

      <div className="mb-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          ISO
        </p>
        {hasIso ? (
          <div className="flex flex-wrap gap-2">
            {isoList.map((item) => (
              <Badge key={item} variant="default">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">—</p>
        )}
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          Regulatory
        </p>
        {hasCerts ? (
          <div className="flex flex-wrap gap-2">
            {regulatoryCerts.map((item) => (
              <Badge key={item} variant="default">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">—</p>
        )}
      </div>

      {productSystems.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Product Systems
          </p>
          <div className="flex flex-wrap gap-2">
            {productSystems.map((system) => (
              <span
                key={system}
                className="rounded-lg bg-light-purple/60 px-3 py-1.5 text-xs font-semibold text-primary"
              >
                {system}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
        <p className="text-xs font-medium text-gray-400">Primary System</p>
        <p className="mt-1 text-sm font-semibold text-gray-900">
          {primarySystem && primarySystem !== "—" ? primarySystem : "—"}
        </p>
      </div>
    </Card>
  );
}
