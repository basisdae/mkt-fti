import {
  createEmptyContactInput,
  type NewSupplierFormData,
  type NewSupplierInput,
  type Supplier,
  type SupplierFormContactInput,
} from "@/types/supplier";

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

export function supplierToFormData(supplier: Supplier): NewSupplierFormData {
  return {
    factoryName: supplier.factoryName,
    displayName: supplier.displayName,
    country: supplier.country,
    provinceRegion: supplier.provinceRegion,
    cityDistrict: supplier.cityDistrict,
    fullAddress: supplier.fullAddress,
    locationNote: supplier.locationNote,
    website: supplier.website,
    alibabaLink: supplier.alibabaLink,
    mainProductCategory: supplier.mainProductCategory,
    notes: supplier.notes,
    contacts:
      supplier.contacts.length > 0
        ? supplier.contacts.map(
            (contact): SupplierFormContactInput => ({
              id: contact.id,
              contactName: contact.contactName,
              position: contact.position,
              salesRepCode: contact.salesRepCode,
              wechatId: contact.wechatId,
              whatsapp: contact.whatsapp,
              phone: contact.phone,
              email: contact.email,
              line: contact.line,
              isPrimary: contact.isPrimary,
              isActive: contact.isActive,
              notes: contact.notes,
            }),
          )
        : [createEmptyContactInput()],
  };
}

export function supplierFactoryPatchFromForm(
  form: NewSupplierFormData,
): Partial<Supplier> {
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
    notes: form.notes.trim(),
  };
}
