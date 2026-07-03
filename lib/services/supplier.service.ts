import type { NewSupplierFormData, NewSupplierInput } from "@/types/supplier";

export function buildSupplierFromForm(form: NewSupplierFormData): NewSupplierInput {
  const contacts = form.contacts
    .filter((c) => c.contactName.trim())
    .map((c) => ({
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
    }));

  if (contacts.length > 0 && !contacts.some((c) => c.isPrimary)) {
    contacts[0]!.isPrimary = true;
  }

  return {
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
  };
}
