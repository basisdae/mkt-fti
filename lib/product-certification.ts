import type { ProductCertification } from "@/types/product";
import { CERTIFICATION_OPTIONS } from "@/types/product-form";

const AUTO_ASSIGNED_ISO = new Set(["ISO 9001", "ISO 14001", "TISI Certified"]);

const VALID_REGULATORY_CERTS = new Set<string>(CERTIFICATION_OPTIONS);

export function normalizeProductCertification(
  certification: ProductCertification | null | undefined,
): ProductCertification {
  const cert = certification ?? {
    iso1: "",
    iso2: "",
    iso3: "",
    certifications: [],
    productSystems: [],
  };

  return {
    iso1: AUTO_ASSIGNED_ISO.has(cert.iso1?.trim() ?? "") ? "" : (cert.iso1 ?? ""),
    iso2: AUTO_ASSIGNED_ISO.has(cert.iso2?.trim() ?? "") ? "" : (cert.iso2 ?? ""),
    iso3: AUTO_ASSIGNED_ISO.has(cert.iso3?.trim() ?? "") ? "" : (cert.iso3 ?? ""),
    certifications: (cert.certifications ?? []).filter((item) =>
      VALID_REGULATORY_CERTS.has(item.trim()),
    ),
    productSystems: (cert.productSystems ?? []).filter((item) => item.trim()),
  };
}

export function getRegulatoryCertifications(
  certification: ProductCertification | null | undefined,
): string[] {
  return normalizeProductCertification(certification).certifications;
}

export function hasRegulatoryCertifications(
  certification: ProductCertification | null | undefined,
): boolean {
  return getRegulatoryCertifications(certification).length > 0;
}
