import type { ProductCertification } from "@/types/product";
import { CERTIFICATION_OPTIONS, ISO_OPTIONS } from "@/types/product-form";

const KNOWN_CERTS = new Set<string>(CERTIFICATION_OPTIONS);
const KNOWN_ISO = new Set<string>(ISO_OPTIONS);

export function normalizeTagList(values: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values ?? []) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

/** @deprecated Use normalizeTagList */
export function normalizeIsoList(values: string[] | null | undefined): string[] {
  return normalizeTagList(values);
}

export function normalizeProductCertification(
  certification: ProductCertification | null | undefined,
): ProductCertification {
  const cert = certification ?? {
    iso1: "",
    iso2: "",
    iso3: "",
    iso: [],
    certifications: [],
    productSystems: [],
  };

  return {
    iso1: cert.iso1 ?? "",
    iso2: cert.iso2 ?? "",
    iso3: cert.iso3 ?? "",
    iso: normalizeTagList(cert.iso),
    certifications: normalizeTagList(cert.certifications),
    productSystems: (cert.productSystems ?? []).filter((item) => item.trim()),
  };
}

export function getIsoCertifications(
  certification: ProductCertification | null | undefined,
): string[] {
  return normalizeProductCertification(certification).iso;
}

export function hasIsoCertifications(
  certification: ProductCertification | null | undefined,
): boolean {
  return getIsoCertifications(certification).length > 0;
}

export function isKnownIsoOption(value: string): boolean {
  return KNOWN_ISO.has(value.trim());
}

export function getCustomIsoCertifications(
  certification: ProductCertification | null | undefined,
): string[] {
  return getIsoCertifications(certification).filter(
    (item) => !isKnownIsoOption(item),
  );
}

export function isKnownCertificationOption(value: string): boolean {
  return KNOWN_CERTS.has(value.trim());
}

export function getRegulatoryCertifications(
  certification: ProductCertification | null | undefined,
): string[] {
  return normalizeProductCertification(certification).certifications;
}

export function getCustomCertifications(
  certification: ProductCertification | null | undefined,
): string[] {
  return getRegulatoryCertifications(certification).filter(
    (item) => !isKnownCertificationOption(item),
  );
}

export function hasRegulatoryCertifications(
  certification: ProductCertification | null | undefined,
): boolean {
  return getRegulatoryCertifications(certification).length > 0;
}
