import { generateId } from "@/lib/generate-id";
import {
  DEFAULT_TAG_GROUPS,
  LEGACY_TAG_GROUP_KEYS,
  isOtherTag,
  slugifyTagValue,
  type ProductTag,
  type ProductTagFormState,
  type ProductTagGroupWithTags,
  type ProductTagLink,
} from "@/lib/product-tags";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function getClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createClient();
}

function mapGroup(row: Record<string, unknown>): ProductTagGroupWithTags {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    key: String(row.key ?? ""),
    sortOrder: Number(row.sort_order) || 0,
    active: row.active !== false,
    tags: [],
  };
}

function mapTag(row: Record<string, unknown>): ProductTag {
  return {
    id: String(row.id),
    groupId: String(row.group_id),
    label: String(row.label ?? ""),
    value: String(row.value ?? ""),
    active: row.active !== false,
    sortOrder: Number(row.sort_order) || 0,
  };
}

function assembleCatalog(
  groupRows: Record<string, unknown>[],
  tagRows: Record<string, unknown>[],
): ProductTagGroupWithTags[] {
  const tagsByGroup = new Map<string, ProductTag[]>();
  for (const row of tagRows) {
    const tag = mapTag(row);
    const list = tagsByGroup.get(tag.groupId) ?? [];
    list.push(tag);
    tagsByGroup.set(tag.groupId, list);
  }

  return groupRows.map((row) => {
    const group = mapGroup(row);
    group.tags = (tagsByGroup.get(group.id) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    return group;
  });
}

/** Seed default groups/tags only when missing; deactivate legacy groups. */
export async function ensureProductTagDefaults(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = getClient();
    const { data: groups, error } = await supabase
      .from("product_tag_groups")
      .select("id, key");

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("product_tag_groups") ||
        message.includes("schema cache") ||
        message.includes("does not exist")
      ) {
        return;
      }
      throw new Error(error.message);
    }

    const groupRows = (groups ?? []) as { id: string; key: string }[];
    const existingKeys = new Set(groupRows.map((row) => String(row.key)));

    for (const legacyKey of LEGACY_TAG_GROUP_KEYS) {
      if (!existingKeys.has(legacyKey)) continue;
      await supabase
        .from("product_tag_groups")
        .update({ active: false })
        .eq("key", legacyKey);
    }

    for (const group of DEFAULT_TAG_GROUPS) {
      let groupId =
        groupRows.find((row) => String(row.key) === group.key)?.id ?? null;

      if (!existingKeys.has(group.key)) {
        const id = generateId();
        const { error: insertGroupError } = await supabase
          .from("product_tag_groups")
          .insert({
            id,
            name: group.name,
            key: group.key,
            sort_order: group.sortOrder,
            active: true,
          });
        if (insertGroupError) continue;
        groupId = id;
        existingKeys.add(group.key);
        groupRows.push({ id, key: group.key });
      } else if (groupId) {
        await supabase
          .from("product_tag_groups")
          .update({
            name: group.name,
            sort_order: group.sortOrder,
            active: true,
          })
          .eq("id", groupId);
      }

      if (!groupId) continue;

      const { data: tags } = await supabase
        .from("product_tags")
        .select("id, value, label")
        .eq("group_id", groupId);

      const existingByValue = new Map(
        (tags ?? []).map((row) => [
          String((row as { value: string }).value),
          row as { id: string; value: string; label: string },
        ]),
      );

      for (const tag of group.tags) {
        const existing = existingByValue.get(tag.value);
        if (existing) {
          if (existing.label !== tag.label) {
            await supabase
              .from("product_tags")
              .update({
                label: tag.label,
                sort_order: tag.sortOrder,
                active: true,
              })
              .eq("id", existing.id);
          }
          continue;
        }
        await supabase.from("product_tags").insert({
          id: generateId(),
          group_id: groupId,
          label: tag.label,
          value: tag.value,
          sort_order: tag.sortOrder,
          active: true,
        });
      }
    }
  } catch {
    // Tables may not exist yet.
  }
}

async function loadRawCatalog(): Promise<{
  groups: Record<string, unknown>[];
  tags: Record<string, unknown>[];
} | null> {
  if (!isSupabaseConfigured()) {
    console.error(
      "[product-tags] loadRawCatalog: Supabase is not configured",
    );
    return null;
  }

  try {
    await ensureProductTagDefaults();
    const supabase = getClient();

    const { data: groups, error: groupsError } = await supabase
      .from("product_tag_groups")
      .select("*")
      .order("sort_order", { ascending: true });

    if (groupsError) {
      console.error(
        "[product-tags] loadRawCatalog: groupsError",
        groupsError,
      );
      return null;
    }

    const { data: tags, error: tagsError } = await supabase
      .from("product_tags")
      .select("*")
      .order("sort_order", { ascending: true });

    if (tagsError) {
      console.error("[product-tags] loadRawCatalog: tagsError", tagsError);
      return null;
    }

    return {
      groups: (groups ?? []) as Record<string, unknown>[],
      tags: (tags ?? []) as Record<string, unknown>[],
    };
  } catch (error) {
    console.error("[product-tags] loadRawCatalog: catch", error);
    return null;
  }
}

/** Active groups + active tags (create form, filters, export headers). */
export async function loadProductTagCatalog(): Promise<
  ProductTagGroupWithTags[]
> {
  const raw = await loadRawCatalog();
  if (!raw) return [];

  const activeGroups = raw.groups.filter((row) => row.active !== false);
  const activeGroupIds = new Set(activeGroups.map((row) => String(row.id)));
  const activeTags = raw.tags.filter(
    (row) => row.active !== false && activeGroupIds.has(String(row.group_id)),
  );

  return assembleCatalog(activeGroups, activeTags);
}

/**
 * Active catalog plus inactive tags/groups needed to show existing selections.
 * Disabled tags stay visible on edit but are not offered for new picks.
 */
export async function loadProductTagCatalogForForm(
  selectedTagIds: string[] = [],
): Promise<ProductTagGroupWithTags[]> {
  const raw = await loadRawCatalog();
  if (!raw) return [];

  const selected = new Set(selectedTagIds);
  const activeGroups = raw.groups.filter((row) => row.active !== false);
  const activeGroupIds = new Set(activeGroups.map((row) => String(row.id)));

  const selectedTags = raw.tags.filter((row) => selected.has(String(row.id)));
  const selectedGroupIds = new Set(
    selectedTags.map((row) => String(row.group_id)),
  );

  const groups = raw.groups.filter(
    (row) =>
      row.active !== false || selectedGroupIds.has(String(row.id)),
  );

  const tags = raw.tags.filter((row) => {
    const groupId = String(row.group_id);
    if (selected.has(String(row.id))) return true;
    return row.active !== false && activeGroupIds.has(groupId);
  });

  return assembleCatalog(groups, tags);
}

/** Full catalog including inactive (Settings admin). */
export async function loadFullProductTagCatalog(): Promise<
  ProductTagGroupWithTags[]
> {
  const raw = await loadRawCatalog();
  if (!raw) return [];
  return assembleCatalog(raw.groups, raw.tags);
}

export async function listAllProductTagLinks(): Promise<
  Map<string, ProductTagLink[]>
> {
  if (!isSupabaseConfigured()) return new Map();

  try {
    const supabase = getClient();
    const { data, error } = await supabase.from("product_tag_links").select(`
        id,
        product_id,
        tag_id,
        custom_label,
        product_tags (
          label,
          value,
          group_id,
          active,
          product_tag_groups ( key, name, active )
        )
      `);

    if (error) {
      const simple = await supabase.from("product_tag_links").select("*");
      if (simple.error) return new Map();

      const catalog = await loadFullProductTagCatalog();
      const tagById = new Map(
        catalog.flatMap((group) =>
          group.tags.map((tag) => [
            tag.id,
            { tag, groupKey: group.key, groupName: group.name },
          ]),
        ),
      );

      const map = new Map<string, ProductTagLink[]>();
      for (const row of simple.data ?? []) {
        const productId = String((row as { product_id: string }).product_id);
        const tagId = String((row as { tag_id: string }).tag_id);
        const meta = tagById.get(tagId);
        const link: ProductTagLink = {
          id: String((row as { id: string }).id),
          productId,
          tagId,
          customLabel:
            typeof (row as { custom_label?: string }).custom_label === "string"
              ? (row as { custom_label: string }).custom_label
              : null,
          label: meta?.tag.label,
          groupKey: meta?.groupKey,
          groupName: meta?.groupName,
        };
        const list = map.get(productId) ?? [];
        list.push(link);
        map.set(productId, list);
      }
      return map;
    }

    const map = new Map<string, ProductTagLink[]>();
    for (const row of data ?? []) {
      const record = row as Record<string, unknown>;
      const productId = String(record.product_id);
      const tag = record.product_tags as Record<string, unknown> | null;
      const group = tag?.product_tag_groups as Record<string, unknown> | null;
      const link: ProductTagLink = {
        id: String(record.id),
        productId,
        tagId: String(record.tag_id),
        customLabel:
          typeof record.custom_label === "string" ? record.custom_label : null,
        label: tag ? String(tag.label ?? "") : undefined,
        groupKey: group ? String(group.key ?? "") : undefined,
        groupName: group ? String(group.name ?? "") : undefined,
      };
      const list = map.get(productId) ?? [];
      list.push(link);
      map.set(productId, list);
    }
    return map;
  } catch {
    return new Map();
  }
}

async function findOrCreateTag(
  groupId: string,
  label: string,
): Promise<ProductTag | null> {
  const supabase = getClient();
  const trimmed = label.trim();
  if (!trimmed) return null;

  const value = slugifyTagValue(trimmed);

  const { data: existing } = await supabase
    .from("product_tags")
    .select("*")
    .eq("group_id", groupId)
    .eq("value", value)
    .maybeSingle();

  if (existing) {
    const tag = mapTag(existing as Record<string, unknown>);
    if (!tag.active) {
      await supabase
        .from("product_tags")
        .update({ active: true, label: trimmed })
        .eq("id", tag.id);
      return { ...tag, active: true, label: trimmed };
    }
    return tag;
  }

  const id = generateId();
  const { data: created, error } = await supabase
    .from("product_tags")
    .insert({
      id,
      group_id: groupId,
      label: trimmed,
      value,
      active: true,
      sort_order: 50,
    })
    .select()
    .single();

  if (error) {
    const { data: retry } = await supabase
      .from("product_tags")
      .select("*")
      .eq("group_id", groupId)
      .eq("value", value)
      .maybeSingle();
    return retry ? mapTag(retry as Record<string, unknown>) : null;
  }

  return mapTag(created as Record<string, unknown>);
}

/**
 * Resolve form selections into tag links.
 * Other + custom text creates a reusable tag in that group.
 */
export async function resolveTagLinksFromForm(
  _productId: string,
  groups: ProductTagGroupWithTags[],
  form: ProductTagFormState,
): Promise<{ tagId: string; customLabel: string | null }[]> {
  const links: { tagId: string; customLabel: string | null }[] = [];
  const handled = new Set<string>();

  for (const group of groups) {
    const otherTag = group.tags.find(isOtherTag);
    const selectedInGroup = group.tags.filter((tag) =>
      form.selectedTagIds.includes(tag.id),
    );

    for (const tag of selectedInGroup) {
      if (isOtherTag(tag)) continue;
      links.push({ tagId: tag.id, customLabel: null });
      handled.add(tag.id);
    }

    if (otherTag && form.selectedTagIds.includes(otherTag.id)) {
      handled.add(otherTag.id);
      const otherText = form.otherTextByGroupKey[group.key]?.trim() ?? "";
      if (otherText) {
        const created = await findOrCreateTag(group.id, otherText);
        if (created) {
          links.push({ tagId: created.id, customLabel: null });
          handled.add(created.id);
        }
      }
    }
  }

  // Preserve any selected ids not present in catalog (should be rare).
  for (const tagId of form.selectedTagIds) {
    if (handled.has(tagId)) continue;
    links.push({ tagId, customLabel: null });
  }

  return links;
}

export async function saveProductTagLinks(
  productId: string,
  links: { tagId: string; customLabel: string | null }[],
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getClient();
  const { error: deleteError } = await supabase
    .from("product_tag_links")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    const message = deleteError.message.toLowerCase();
    if (
      message.includes("product_tag_links") ||
      message.includes("schema cache") ||
      message.includes("does not exist")
    ) {
      throw new Error(
        "Product tags tables are missing. Run migration 20260704190000_product_tags.sql.",
      );
    }
    throw new Error(deleteError.message);
  }

  if (links.length === 0) return;

  const { error } = await supabase.from("product_tag_links").insert(
    links.map((link) => ({
      id: generateId(),
      product_id: productId,
      tag_id: link.tagId,
      custom_label: link.customLabel,
    })),
  );

  if (error) throw new Error(error.message);
}

export async function listProductTagLinks(
  productId: string,
): Promise<ProductTagLink[]> {
  const all = await listAllProductTagLinks();
  return all.get(productId) ?? [];
}

export async function updateProductTagGroup(input: {
  id: string;
  name?: string;
  active?: boolean;
  sortOrder?: number;
}): Promise<void> {
  const supabase = getClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.active !== undefined) patch.active = input.active;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { error } = await supabase
    .from("product_tag_groups")
    .update(patch)
    .eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function updateProductTag(input: {
  id: string;
  label?: string;
  active?: boolean;
  sortOrder?: number;
}): Promise<void> {
  const supabase = getClient();
  const patch: Record<string, unknown> = {};
  if (input.label !== undefined) {
    patch.label = input.label.trim();
  }
  if (input.active !== undefined) patch.active = input.active;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { error } = await supabase
    .from("product_tags")
    .update(patch)
    .eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function createProductTag(input: {
  groupId: string;
  label: string;
}): Promise<ProductTag> {
  const created = await findOrCreateTag(input.groupId, input.label);
  if (!created) throw new Error("Could not create tag.");
  return created;
}

export async function createProductTagGroup(input: {
  name: string;
  key?: string;
}): Promise<void> {
  const supabase = getClient();
  const name = input.name.trim();
  if (!name) throw new Error("Group name is required.");
  const key = input.key?.trim() || slugifyTagValue(name);
  const { data: existing } = await supabase
    .from("product_tag_groups")
    .select("id")
    .eq("key", key)
    .maybeSingle();
  if (existing) throw new Error("A group with this key already exists.");

  const { data: rows } = await supabase
    .from("product_tag_groups")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const sortOrder =
    rows && rows.length > 0
      ? Number((rows[0] as { sort_order: number }).sort_order) + 1
      : 0;

  const groupId = generateId();
  const { error } = await supabase.from("product_tag_groups").insert({
    id: groupId,
    name,
    key,
    sort_order: sortOrder,
    active: true,
  });
  if (error) throw new Error(error.message);

  const { error: tagError } = await supabase.from("product_tags").insert({
    id: generateId(),
    group_id: groupId,
    label: "Other",
    value: "other",
    sort_order: 99,
    active: true,
  });
  if (tagError) throw new Error(tagError.message);
}
