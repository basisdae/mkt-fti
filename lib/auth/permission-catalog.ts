/** Stable permission keys — data-driven access control. */
export const PERMISSION_KEYS = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.edit",
  "products.delete",
  "products.export_resume",
  "suppliers.view",
  "suppliers.create",
  "suppliers.edit",
  "suppliers.delete",
  "suppliers.company_profile",
  "rnd.view",
  "rnd.edit_spec",
  "pipeline.view",
  "pipeline.edit",
  "timeline.view",
  "timeline.edit",
  "notes.view",
  "notes.edit",
  "ideas.view",
  "ideas.edit",
  "brand_board.view",
  "brand_board.edit",
  "simulator.view",
  "simulator.edit",
  "settings.view",
  "users.manage",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export interface PermissionDefinition {
  key: PermissionKey;
  group: string;
  label: string;
}

/** UI catalog for Manage Users checkboxes. */
export const PERMISSION_CATALOG: PermissionDefinition[] = [
  { key: "dashboard.view", group: "Dashboard", label: "View" },
  { key: "products.view", group: "Products", label: "View" },
  { key: "products.create", group: "Products", label: "Create" },
  { key: "products.edit", group: "Products", label: "Edit" },
  { key: "products.delete", group: "Products", label: "Delete" },
  { key: "products.export_resume", group: "Products", label: "Export Resume" },
  { key: "suppliers.view", group: "Supplier", label: "View" },
  { key: "suppliers.create", group: "Supplier", label: "Create" },
  { key: "suppliers.edit", group: "Supplier", label: "Edit" },
  { key: "suppliers.delete", group: "Supplier", label: "Delete" },
  {
    key: "suppliers.company_profile",
    group: "Supplier",
    label: "Company Profile",
  },
  { key: "rnd.view", group: "R&D", label: "View" },
  { key: "rnd.edit_spec", group: "R&D", label: "Edit Specification" },
  { key: "pipeline.view", group: "Pipeline", label: "View" },
  { key: "pipeline.edit", group: "Pipeline", label: "Edit" },
  { key: "timeline.view", group: "Timeline", label: "View" },
  { key: "timeline.edit", group: "Timeline", label: "Edit" },
  { key: "notes.view", group: "Notes", label: "View" },
  { key: "notes.edit", group: "Notes", label: "Edit" },
  { key: "ideas.view", group: "Ideas", label: "View" },
  { key: "ideas.edit", group: "Ideas", label: "Edit" },
  { key: "brand_board.view", group: "Brand Board", label: "View" },
  { key: "brand_board.edit", group: "Brand Board", label: "Edit" },
  { key: "simulator.view", group: "Simulator", label: "View" },
  { key: "simulator.edit", group: "Simulator", label: "Edit" },
  { key: "settings.view", group: "Settings", label: "View" },
  { key: "users.manage", group: "Manage Users", label: "Access" },
];

export function isPermissionKey(value: string): value is PermissionKey {
  return (PERMISSION_KEYS as readonly string[]).includes(value);
}

export function normalizePermissions(
  values: string[] | null | undefined,
): PermissionKey[] {
  if (!values?.length) return [];
  const unique = new Set<PermissionKey>();
  for (const value of values) {
    if (isPermissionKey(value)) unique.add(value);
  }
  return PERMISSION_KEYS.filter((key) => unique.has(key));
}

const ALL = [...PERMISSION_KEYS];

const VIEW_ONLY: PermissionKey[] = [
  "dashboard.view",
  "products.view",
  "products.export_resume",
  "suppliers.view",
  "suppliers.company_profile",
  "rnd.view",
  "pipeline.view",
  "timeline.view",
  "notes.view",
  "ideas.view",
  "brand_board.view",
  "simulator.view",
];

/** Role templates — starting permissions only; admin may customize per user. */
export const ROLE_PERMISSION_TEMPLATES: Record<string, PermissionKey[]> = {
  admin: ALL,
  mkt_hq: ALL.filter((key) => key !== "users.manage"),
  rnd: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.edit",
    "products.delete",
    "products.export_resume",
    "suppliers.view",
    "suppliers.company_profile",
    "rnd.view",
    "rnd.edit_spec",
    "pipeline.view",
    "pipeline.edit",
    "timeline.view",
    "timeline.edit",
    "notes.view",
    "notes.edit",
    "ideas.view",
    "ideas.edit",
    "brand_board.view",
    "settings.view",
  ],
  pu: [
    "dashboard.view",
    "products.view",
    "products.export_resume",
    "suppliers.view",
    "suppliers.create",
    "suppliers.edit",
    "suppliers.delete",
    "suppliers.company_profile",
    "timeline.view",
  ],
  sale: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.edit",
    "products.export_resume",
    "suppliers.view",
    "suppliers.company_profile",
    "timeline.view",
    "brand_board.view",
    "brand_board.edit",
    "settings.view",
  ],
  ceo: VIEW_ONLY,
};

export function getDefaultPermissionsForRole(role: string): PermissionKey[] {
  return [...(ROLE_PERMISSION_TEMPLATES[role] ?? VIEW_ONLY)];
}

export function groupPermissionCatalog(): {
  group: string;
  items: PermissionDefinition[];
}[] {
  const map = new Map<string, PermissionDefinition[]>();
  for (const item of PERMISSION_CATALOG) {
    const list = map.get(item.group) ?? [];
    list.push(item);
    map.set(item.group, list);
  }
  return [...map.entries()].map(([group, items]) => ({ group, items }));
}

/** Nav href → required view permission. */
export const NAV_PERMISSION_MAP: Record<string, PermissionKey> = {
  "/dashboard": "dashboard.view",
  "/products": "products.view",
  "/rnd/specs": "rnd.view",
  "/suppliers": "suppliers.view",
  "/pipeline": "pipeline.view",
  "/simulator": "simulator.view",
  "/timeline": "timeline.view",
  "/notes": "notes.view",
  "/ideas": "ideas.view",
  "/brand-board": "brand_board.view",
  "/settings": "settings.view",
};
