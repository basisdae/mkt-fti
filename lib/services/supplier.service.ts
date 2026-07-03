import { createSupplier, createSupplierContact } from "@/lib/supplier-builder";
import type { NewSupplierFormData } from "@/types/supplier";
import type { Supplier } from "@/types/supplier";

export function buildSupplierFromForm(form: NewSupplierFormData): Supplier {
  const now = new Date().toISOString();
  const id = `sup-${Date.now()}`;

  const contacts = form.contacts
    .filter((c) => c.contactName.trim())
    .map((c, index) =>
      createSupplierContact(`${id}-contact-${index + 1}`, {
        contactName: c.contactName.trim(),
        position: c.position.trim(),
        salesRepCode: c.salesRepCode.trim(),
        wechatId: c.wechatId.trim(),
        whatsapp: c.whatsapp.trim(),
        phone: c.phone.trim(),
        email: c.email.trim(),
        line: c.line.trim(),
        isPrimary: c.isPrimary,
        isActive: c.isActive,
        notes: c.notes.trim(),
      }),
    );

  return createSupplier({
    id,
    factoryName: form.factoryName.trim(),
    displayName: form.displayName.trim() || form.factoryName.trim(),
    country: form.country.trim() || "China",
    provinceRegion: form.provinceRegion.trim(),
    cityDistrict: form.cityDistrict.trim(),
    fullAddress: form.fullAddress.trim(),
    locationNote: form.locationNote.trim(),
    website: form.website.trim(),
    alibabaLink: form.alibabaLink.trim(),
    mainProductCategory: form.mainProductCategory.trim(),
    imageUrl: null,
    notes: form.notes.trim(),
    contacts,
    updatedAt: now,
  });
}
