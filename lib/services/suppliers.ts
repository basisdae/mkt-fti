import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  NewSupplierInput,
  Supplier,
  SupplierContact,
  SupplierContactInput,
} from "@/types/supplier";

interface SupplierRow {
  id: string;
  factory_name: string;
  display_name: string;
  country: string;
  province_region: string;
  city_district: string;
  full_address: string;
  location_note: string;
  website: string;
  alibaba_link: string;
  main_product_category: string;
  image_url: string | null;
  notes: string;
  updated_at: string;
}

interface SupplierContactRow {
  id: string;
  supplier_id: string;
  contact_name: string;
  position: string;
  sales_rep_code: string;
  wechat_id: string;
  whatsapp: string;
  phone: string;
  email: string;
  line: string;
  image_url: string | null;
  is_primary: boolean;
  is_active: boolean;
  notes: string;
}

type SupplierInsertRow = Omit<SupplierRow, "id" | "updated_at">;
type SupplierContactInsertRow = Omit<SupplierContactRow, "id">;

function mapContactRow(row: SupplierContactRow): SupplierContact {
  return {
    id: row.id,
    contactName: row.contact_name,
    position: row.position,
    salesRepCode: row.sales_rep_code,
    wechatId: row.wechat_id,
    whatsapp: row.whatsapp,
    phone: row.phone,
    email: row.email,
    line: row.line,
    imageUrl: row.image_url,
    isPrimary: row.is_primary,
    isActive: row.is_active,
    notes: row.notes,
  };
}

function mapSupplierRow(
  row: SupplierRow,
  contacts: SupplierContactRow[],
): Supplier {
  return {
    id: row.id,
    factoryName: row.factory_name,
    displayName: row.display_name,
    country: row.country,
    provinceRegion: row.province_region,
    cityDistrict: row.city_district,
    fullAddress: row.full_address,
    locationNote: row.location_note,
    website: row.website,
    alibabaLink: row.alibaba_link,
    mainProductCategory: row.main_product_category,
    imageUrl: row.image_url,
    notes: row.notes,
    contacts: contacts.map(mapContactRow),
    updatedAt: row.updated_at,
  };
}

function supplierInputToInsert(input: NewSupplierInput): SupplierInsertRow {
  return {
    factory_name: input.factoryName,
    display_name: input.displayName,
    country: input.country,
    province_region: input.provinceRegion,
    city_district: input.cityDistrict,
    full_address: input.fullAddress,
    location_note: input.locationNote,
    website: input.website,
    alibaba_link: input.alibabaLink,
    main_product_category: input.mainProductCategory,
    image_url: input.imageUrl,
    notes: input.notes,
  };
}

function contactInputToInsert(
  supplierId: string,
  input: SupplierContactInput,
): SupplierContactInsertRow {
  return {
    supplier_id: supplierId,
    contact_name: input.contactName,
    position: input.position,
    sales_rep_code: input.salesRepCode,
    wechat_id: input.wechatId,
    whatsapp: input.whatsapp,
    phone: input.phone,
    email: input.email,
    line: input.line,
    image_url: null,
    is_primary: input.isPrimary,
    is_active: input.isActive,
    notes: input.notes,
  };
}

function getClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return createClient();
}

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function listSuppliers(): Promise<Supplier[]> {
  const supabase = getClient();

  const { data: supplierRows, error: supplierError } = await supabase
    .from("suppliers")
    .select("*")
    .order("updated_at", { ascending: false });

  throwOnError(supplierError);

  const rows = (supplierRows ?? []) as SupplierRow[];
  if (rows.length === 0) return [];

  const supplierIds = rows.map((row) => row.id);
  const { data: contactRows, error: contactError } = await supabase
    .from("supplier_contacts")
    .select("*")
    .in("supplier_id", supplierIds);

  throwOnError(contactError);

  const contactsBySupplier = ((contactRows ?? []) as SupplierContactRow[]).reduce<
    Record<string, SupplierContactRow[]>
  >((acc, contact) => {
    acc[contact.supplier_id] ??= [];
    acc[contact.supplier_id]!.push(contact);
    return acc;
  }, {});

  return rows.map((row) =>
    mapSupplierRow(row, contactsBySupplier[row.id] ?? []),
  );
}

export async function createSupplier(input: NewSupplierInput): Promise<Supplier> {
  const supabase = getClient();

  const { data: supplierRow, error: supplierError } = await supabase
    .from("suppliers")
    .insert(supplierInputToInsert(input))
    .select()
    .single();

  throwOnError(supplierError);

  const createdSupplier = supplierRow as SupplierRow;
  let contactRows: SupplierContactRow[] = [];

  if (input.contacts.length > 0) {
    const { data: insertedContacts, error: contactError } = await supabase
      .from("supplier_contacts")
      .insert(
        input.contacts.map((contact) =>
          contactInputToInsert(createdSupplier.id, contact),
        ),
      )
      .select();

    throwOnError(contactError);
    contactRows = (insertedContacts ?? []) as SupplierContactRow[];
  }

  return mapSupplierRow(createdSupplier, contactRows);
}

export async function updateSupplier(
  supplierId: string,
  patch: Partial<Supplier>,
): Promise<void> {
  const supabase = getClient();
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.factoryName !== undefined) row.factory_name = patch.factoryName;
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.country !== undefined) row.country = patch.country;
  if (patch.provinceRegion !== undefined) row.province_region = patch.provinceRegion;
  if (patch.cityDistrict !== undefined) row.city_district = patch.cityDistrict;
  if (patch.fullAddress !== undefined) row.full_address = patch.fullAddress;
  if (patch.locationNote !== undefined) row.location_note = patch.locationNote;
  if (patch.website !== undefined) row.website = patch.website;
  if (patch.alibabaLink !== undefined) row.alibaba_link = patch.alibabaLink;
  if (patch.mainProductCategory !== undefined) {
    row.main_product_category = patch.mainProductCategory;
  }
  if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl;
  if (patch.notes !== undefined) row.notes = patch.notes;

  const { error } = await supabase
    .from("suppliers")
    .update(row)
    .eq("id", supplierId);

  throwOnError(error);
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", supplierId);

  throwOnError(error);
}

export async function updateSupplierContact(
  supplierId: string,
  contactId: string,
  input: SupplierContactInput,
): Promise<SupplierContact> {
  const supabase = getClient();

  if (input.isPrimary) {
    await supabase
      .from("supplier_contacts")
      .update({ is_primary: false })
      .eq("supplier_id", supplierId);
  }

  const { data, error } = await supabase
    .from("supplier_contacts")
    .update({
      contact_name: input.contactName,
      position: input.position,
      sales_rep_code: input.salesRepCode,
      wechat_id: input.wechatId,
      whatsapp: input.whatsapp,
      phone: input.phone,
      email: input.email,
      line: input.line,
      is_primary: input.isPrimary,
      is_active: input.isActive,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId)
    .select()
    .single();

  throwOnError(error);

  await supabase
    .from("suppliers")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", supplierId);

  return mapContactRow(data as SupplierContactRow);
}

export async function addSupplierContact(
  supplierId: string,
  input: SupplierContactInput,
): Promise<SupplierContact> {
  const supabase = getClient();

  if (input.isPrimary) {
    await supabase
      .from("supplier_contacts")
      .update({ is_primary: false })
      .eq("supplier_id", supplierId);
  }

  const { data, error } = await supabase
    .from("supplier_contacts")
    .insert(contactInputToInsert(supplierId, input))
    .select()
    .single();

  throwOnError(error);

  await supabase
    .from("suppliers")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", supplierId);

  return mapContactRow(data as SupplierContactRow);
}

export async function setSupplierPrimaryContact(
  supplierId: string,
  contactId: string,
): Promise<void> {
  const supabase = getClient();

  await supabase
    .from("supplier_contacts")
    .update({ is_primary: false })
    .eq("supplier_id", supplierId);

  const { error } = await supabase
    .from("supplier_contacts")
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq("id", contactId);

  throwOnError(error);

  await supabase
    .from("suppliers")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", supplierId);
}
