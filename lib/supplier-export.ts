/**
 * Supplier catalog Excel export (read-only).
 * Does not write to the database or modify suppliers/products.
 */
import { logActivity } from "@/lib/activity-log";
import {
  addExportMetaSheet,
  applyWorkbookIdentity,
  buildSupplierExportFileName,
  downloadWorkbook,
  exportCell,
  finalizeDataSheet,
  styleExportHeader,
} from "@/lib/export-standard";
import { formatLeadTimeDays } from "@/lib/lead-time";
import { countLinkedProducts } from "@/lib/supplier";
import type { ProductView } from "@/types/product";
import type { Supplier } from "@/types/supplier";

function formatContacts(supplier: Supplier): string {
  const contacts = supplier.contacts ?? [];
  if (contacts.length === 0) return "";
  return contacts
    .map((contact) => {
      const parts = [
        contact.contactName,
        contact.position,
        contact.phone,
        contact.email,
        contact.wechatId ? `WeChat:${contact.wechatId}` : "",
        contact.whatsapp ? `WA:${contact.whatsapp}` : "",
      ].filter((part) => part && String(part).trim());
      return parts.join(" · ");
    })
    .filter(Boolean)
    .join(" | ");
}

function linkedProducts(supplier: Supplier, products: ProductView[]): ProductView[] {
  return products.filter(
    (product) =>
      product.supplierId === supplier.id ||
      (product.supplier &&
        product.supplier.trim().toLowerCase() ===
          (supplier.displayName || supplier.factoryName).trim().toLowerCase()),
  );
}

function supplierLeadTime(
  supplier: Supplier,
  products: ProductView[],
): string {
  const times = new Set<string>();
  for (const product of linkedProducts(supplier, products)) {
    for (const tier of product.priceOptions ?? []) {
      const label = formatLeadTimeDays(tier.leadTime);
      if (label.trim() && label !== "—") times.add(label);
    }
  }
  return [...times].join(" | ");
}

function supplierCertificates(
  supplier: Supplier,
  products: ProductView[],
): string {
  const certs = new Set<string>();
  for (const product of linkedProducts(supplier, products)) {
    for (const cert of product.certification?.certifications ?? []) {
      if (cert.trim()) certs.add(cert.trim());
    }
    for (const iso of product.certification?.iso ?? []) {
      if (iso.trim()) certs.add(iso.trim());
    }
  }
  return [...certs].join(" | ");
}

export async function exportSupplierExcel(
  suppliers: Supplier[],
  products: ProductView[],
): Promise<string> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const generatedAt = new Date();
  applyWorkbookIdentity(workbook, "MKT HQ Supplier Export", generatedAt);

  addExportMetaSheet(
    workbook,
    "MKT HQ — Supplier Export",
    [
      ["Suppliers exported", suppliers.length],
      ["Sheets", "Suppliers, Contacts"],
    ],
    generatedAt,
  );

  const sheet = workbook.addWorksheet("Suppliers");
  const headers = [
    "Supplier Name",
    "Country",
    "Factory",
    "Contacts",
    "Lead Time",
    "Products Count",
    "Certificates",
    "Notes",
    "Province / Region",
    "City / District",
    "Website",
    "Alibaba Link",
    "Main Category",
  ];
  sheet.addRow(headers);
  styleExportHeader(sheet.getRow(1));

  for (const supplier of suppliers) {
    try {
      sheet.addRow([
        exportCell(supplier.displayName || supplier.factoryName),
        exportCell(supplier.country),
        exportCell(supplier.factoryName),
        exportCell(formatContacts(supplier)),
        exportCell(supplierLeadTime(supplier, products)),
        countLinkedProducts(supplier.id, products),
        exportCell(supplierCertificates(supplier, products)),
        exportCell(supplier.notes),
        exportCell(supplier.provinceRegion),
        exportCell(supplier.cityDistrict),
        exportCell(supplier.website),
        exportCell(supplier.alibabaLink),
        exportCell(supplier.mainProductCategory),
      ]);
    } catch {
      sheet.addRow([
        exportCell(supplier.displayName || supplier.factoryName),
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    }
  }

  finalizeDataSheet(sheet, { maxWidth: 48 });

  const contactsSheet = workbook.addWorksheet("Contacts");
  contactsSheet.addRow([
    "Supplier Name",
    "Contact Name",
    "Position",
    "Phone",
    "Email",
    "WeChat",
    "WhatsApp",
    "Line",
    "Primary",
    "Active",
    "Notes",
  ]);
  styleExportHeader(contactsSheet.getRow(1));

  for (const supplier of suppliers) {
    const name = supplier.displayName || supplier.factoryName;
    const contacts = supplier.contacts ?? [];
    if (contacts.length === 0) {
      contactsSheet.addRow([exportCell(name), "", "", "", "", "", "", "", "", "", ""]);
      continue;
    }
    for (const contact of contacts) {
      contactsSheet.addRow([
        exportCell(name),
        exportCell(contact.contactName),
        exportCell(contact.position),
        exportCell(contact.phone),
        exportCell(contact.email),
        exportCell(contact.wechatId),
        exportCell(contact.whatsapp),
        exportCell(contact.line),
        contact.isPrimary ? "Yes" : "No",
        contact.isActive === false ? "No" : "Yes",
        exportCell(contact.notes),
      ]);
    }
  }
  finalizeDataSheet(contactsSheet, { maxWidth: 36 });

  const fileName = buildSupplierExportFileName(generatedAt);
  await downloadWorkbook(workbook, fileName);

  void logActivity({
    action: "export.suppliers",
    entityType: "export",
    entityId: fileName,
    entityName: fileName,
    metadata: { supplierCount: suppliers.length },
  });

  return fileName;
}
