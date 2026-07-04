import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { resumeField } from "@/lib/product-specification";
import type { ProductView } from "@/types/product";
import type { Supplier, SupplierContact } from "@/types/supplier";

export interface SupplierProfileContact {
  name: string;
  position: string;
  phone: string;
  email: string;
  wechat: string;
  whatsapp: string;
  isPrimary: boolean;
}

export interface SupplierProfileLinkedProduct {
  id: string;
  name: string;
  code: string;
  brand: string;
  imageUrl: string | null;
}

export interface SupplierProfileInfoRow {
  label: string;
  value: string;
}

export interface SupplierProfileData {
  logoUrl: string | null;
  factoryName: string;
  displayName: string;
  businessType: string;
  country: string;
  region: string;
  city: string;
  locationLine: string;
  category: string;
  supplierScore: string;
  website: string;
  alibabaLink: string;
  fullAddress: string;
  locationNote: string;
  aboutText: string;
  notes: string;
  lastUpdated: string;
  generatedOn: string;
  contacts: SupplierProfileContact[];
  linkedProducts: SupplierProfileLinkedProduct[];
  factoryInfoRows: SupplierProfileInfoRow[];
  certifications: string[];
}

function mapContact(contact: SupplierContact): SupplierProfileContact {
  return {
    name: resumeField(contact.contactName),
    position: resumeField(contact.position),
    phone: resumeField(contact.phone),
    email: resumeField(contact.email),
    wechat: resumeField(contact.wechatId),
    whatsapp: resumeField(contact.whatsapp),
    isPrimary: contact.isPrimary,
  };
}

function formatDate(value: string | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function buildAboutText(supplier: Supplier, categoryLabel: string): string {
  const name = supplier.factoryName.trim() || "This supplier";
  const category = categoryLabel.trim();
  const city = supplier.cityDistrict.trim();
  const region = supplier.provinceRegion.trim();
  const country = supplier.country.trim();
  const location = [city, region, country].filter(Boolean).join(", ");

  const role = category
    ? `an OEM / ODM partner specializing in ${category}`
    : "an OEM / ODM manufacturing partner";

  if (location) {
    return `${name} is ${role}, based in ${location}.`;
  }

  return `${name} is ${role}.`;
}

export function buildSupplierProfileData(
  supplier: Supplier,
  linkedProducts: ProductView[],
): SupplierProfileData {
  const categoryKey = supplier.mainProductCategory.trim();
  const categoryLabel =
    PRODUCT_CATEGORY_LABELS[categoryKey] ?? categoryKey;
  const country = resumeField(supplier.country);
  const region = resumeField(supplier.provinceRegion);
  const city = resumeField(supplier.cityDistrict);
  const locationParts = [city, region, country].filter((part) => part !== "-");

  const factoryInfoRows: SupplierProfileInfoRow[] = [
    { label: "Country", value: country },
    { label: "Region", value: region },
    { label: "City", value: city },
    { label: "Full Address", value: resumeField(supplier.fullAddress) },
    { label: "Location Note", value: resumeField(supplier.locationNote) },
    { label: "Main Category", value: resumeField(categoryLabel) },
    { label: "Website", value: resumeField(supplier.website) },
    { label: "Alibaba / B2B", value: resumeField(supplier.alibabaLink) },
    {
      label: "Linked Products",
      value:
        linkedProducts.length > 0
          ? `${linkedProducts.length} product${linkedProducts.length === 1 ? "" : "s"}`
          : "-",
    },
    { label: "Last Updated", value: formatDate(supplier.updatedAt) },
  ];

  return {
    logoUrl: supplier.logoUrl,
    factoryName: resumeField(supplier.factoryName),
    displayName: resumeField(supplier.displayName),
    // Capability label until a dedicated business-type field exists
    businessType: "OEM / ODM",
    country,
    region,
    city,
    locationLine: locationParts.length > 0 ? locationParts.join(", ") : "-",
    category: resumeField(categoryLabel),
    // Future: dedicated supplier score model
    supplierScore: "-",
    website: resumeField(supplier.website),
    alibabaLink: resumeField(supplier.alibabaLink),
    fullAddress: resumeField(supplier.fullAddress),
    locationNote: resumeField(supplier.locationNote),
    aboutText: buildAboutText(supplier, categoryLabel),
    notes: resumeField(supplier.notes),
    lastUpdated: formatDate(supplier.updatedAt),
    generatedOn: formatDate(new Date().toISOString()),
    contacts: supplier.contacts
      .filter((contact) => contact.isActive !== false)
      .map(mapContact),
    linkedProducts: linkedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      code: product.code,
      brand: product.brand,
      imageUrl: product.imageUrl,
    })),
    factoryInfoRows,
    // Future: supplier certifications model
    certifications: [],
  };
}
