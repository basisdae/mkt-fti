import type {
  PackagingInformation,
  Product,
  ProductDimension,
  ProductSpecification,
  ProductSpecStatus,
} from "@/types/product";

export const PRODUCT_SPEC_STATUS_LABELS: Record<ProductSpecStatus, string> = {
  not_started: "Not Started",
  draft: "Draft",
  completed: "Completed",
  need_review: "Need Review",
};

export const PRODUCT_SPEC_STATUS_OPTIONS: {
  value: ProductSpecStatus;
  label: string;
}[] = [
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "need_review", label: "Need Review" },
];

export function createEmptyProductDimension(): ProductDimension {
  return { height: "", width: "", depth: "", weight: "" };
}

export function createEmptyPackagingInformation(): PackagingInformation {
  return {
    cartonWidth: "",
    cartonDepth: "",
    cartonHeight: "",
    grossWeight: "",
    netWeight: "",
    unitsPerCarton: "",
    cbm: "",
  };
}

export function createEmptyProductSpecification(): ProductSpecification {
  return {
    material: "",
    connector: "",
    voltage: "",
    power: "",
    flowRate: "",
    pressure: "",
    productDimension: createEmptyProductDimension(),
    packaging: createEmptyPackagingInformation(),
    installation: "",
    warranty: "",
    remark: "",
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** CBM from carton dimensions in mm: W × D × H / 1,000,000,000 */
export function calculateCbmFromMm(
  widthMm: string,
  depthMm: string,
  heightMm: string,
): string {
  const width = Number.parseFloat(widthMm);
  const depth = Number.parseFloat(depthMm);
  const height = Number.parseFloat(heightMm);
  if (
    ![width, depth, height].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  ) {
    return "";
  }
  const cbm = (width * depth * height) / 1_000_000_000;
  return cbm.toFixed(6).replace(/\.?0+$/, "");
}

export function sanitizeNumericInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join("")}`;
}

export function normalizeProductDimension(
  input?: Partial<ProductDimension> | null,
): ProductDimension {
  const empty = createEmptyProductDimension();
  if (!input) return empty;
  return {
    height: input.height ?? "",
    width: input.width ?? "",
    depth: input.depth ?? "",
    weight: input.weight ?? "",
  };
}

export function normalizePackagingInformation(
  input?: Partial<PackagingInformation> | null,
): PackagingInformation {
  const empty = createEmptyPackagingInformation();
  if (!input) return empty;
  return {
    cartonWidth: input.cartonWidth ?? "",
    cartonDepth: input.cartonDepth ?? "",
    cartonHeight: input.cartonHeight ?? "",
    grossWeight: input.grossWeight ?? "",
    netWeight: input.netWeight ?? "",
    unitsPerCarton: input.unitsPerCarton ?? "",
    cbm: input.cbm ?? "",
  };
}

export function normalizeProductSpecification(
  input?: Partial<ProductSpecification> | Record<string, unknown> | null,
): ProductSpecification {
  const empty = createEmptyProductSpecification();
  if (!input) return empty;

  const legacy = input as Record<string, unknown>;
  const dimensionInput = asRecord(legacy.productDimension);
  const packagingInput = asRecord(legacy.packaging);

  const productDimension = normalizeProductDimension({
    height: str(dimensionInput.height),
    width: str(dimensionInput.width),
    depth: str(dimensionInput.depth),
    weight:
      str(dimensionInput.weight) ||
      str(legacy.weight) ||
      str(legacy.netWeight) ||
      "",
  });

  // Legacy single "dimension" text is not auto-split; keep weight only.
  const packaging = normalizePackagingInformation({
    cartonWidth: str(packagingInput.cartonWidth),
    cartonDepth: str(packagingInput.cartonDepth),
    cartonHeight: str(packagingInput.cartonHeight),
    grossWeight:
      str(packagingInput.grossWeight) || str(legacy.grossWeight) || "",
    netWeight: str(packagingInput.netWeight) || str(legacy.netWeight) || "",
    unitsPerCarton:
      str(packagingInput.unitsPerCarton) || str(legacy.unitsPerCarton) || "",
    cbm: str(packagingInput.cbm) || str(legacy.cbm) || "",
  });

  return {
    material: str(legacy.material),
    connector: str(legacy.connector) || str(legacy.plugType),
    voltage: str(legacy.voltage),
    power: str(legacy.power),
    flowRate: str(legacy.flowRate),
    pressure: str(legacy.pressure),
    productDimension,
    packaging,
    installation: str(legacy.installation),
    warranty: str(legacy.warranty),
    remark:
      str(legacy.remark) ||
      str(legacy.features) ||
      str(legacy.packing) ||
      str(legacy.packagingNotes) ||
      "",
  };
}

function hasText(value: string): boolean {
  return Boolean(value.trim());
}

function hasDimensionValues(dimension: ProductDimension): boolean {
  return (
    hasText(dimension.height) ||
    hasText(dimension.width) ||
    hasText(dimension.depth) ||
    hasText(dimension.weight)
  );
}

function hasPackagingValues(packaging: PackagingInformation): boolean {
  return (
    hasText(packaging.cartonWidth) ||
    hasText(packaging.cartonDepth) ||
    hasText(packaging.cartonHeight) ||
    hasText(packaging.grossWeight) ||
    hasText(packaging.netWeight) ||
    hasText(packaging.unitsPerCarton) ||
    hasText(packaging.cbm)
  );
}

/** True when at least one specification field has a value. */
export function hasProductSpecification(
  specification?: ProductSpecification | null,
): boolean {
  const spec = normalizeProductSpecification(specification);
  return (
    hasText(spec.material) ||
    hasText(spec.connector) ||
    hasText(spec.voltage) ||
    hasText(spec.power) ||
    hasText(spec.flowRate) ||
    hasText(spec.pressure) ||
    hasDimensionValues(spec.productDimension) ||
    hasPackagingValues(spec.packaging) ||
    hasText(spec.installation) ||
    hasText(spec.warranty) ||
    hasText(spec.remark)
  );
}

/**
 * Resolve display/workflow status.
 * Empty fields always resolve to Not Started.
 */
export function resolveProductSpecStatus(
  product: Pick<Product, "specification" | "specStatus">,
): ProductSpecStatus {
  if (!hasProductSpecification(product.specification)) {
    return "not_started";
  }

  const stored = product.specStatus;
  if (
    stored === "draft" ||
    stored === "completed" ||
    stored === "need_review"
  ) {
    return stored;
  }

  return "draft";
}

/** Status to persist when saving the form. */
export function resolveSpecStatusOnSave(
  specification: ProductSpecification,
  chosen: ProductSpecStatus | "",
): ProductSpecStatus {
  if (!hasProductSpecification(specification)) {
    return "not_started";
  }
  if (chosen === "completed" || chosen === "need_review" || chosen === "draft") {
    return chosen;
  }
  return "draft";
}

export function getSpecStatusBadgeClasses(status: ProductSpecStatus): string {
  switch (status) {
    case "not_started":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "draft":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "completed":
      return "bg-green-50 text-green-800 border-green-200";
    case "need_review":
      return "bg-red-50 text-[#9F1239] border-red-200";
  }
}

export function getSpecActionLabel(status: ProductSpecStatus): string {
  return status === "not_started" ? "Apply Spec" : "Edit Spec";
}

/** Products still needing R&D / MKT attention on technical specs. */
export function needsSpecWork(
  product: Pick<Product, "specification" | "specStatus">,
): boolean {
  const status = resolveProductSpecStatus(product);
  return (
    status === "not_started" ||
    status === "draft" ||
    status === "need_review"
  );
}

const SPEC_QUEUE_PRIORITY: Record<ProductSpecStatus, number> = {
  need_review: 0,
  not_started: 1,
  draft: 2,
  completed: 3,
};

export function sortProductsBySpecQueue<
  T extends Pick<Product, "specification" | "specStatus" | "updatedAt" | "name">,
>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const statusA = resolveProductSpecStatus(a);
    const statusB = resolveProductSpecStatus(b);
    const priority =
      SPEC_QUEUE_PRIORITY[statusA] - SPEC_QUEUE_PRIORITY[statusB];
    if (priority !== 0) return priority;
    return (
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });
}

export function countProductsBySpecStatus<
  T extends Pick<Product, "specification" | "specStatus">,
>(products: T[]): Record<ProductSpecStatus, number> {
  const counts: Record<ProductSpecStatus, number> = {
    not_started: 0,
    draft: 0,
    completed: 0,
    need_review: 0,
  };
  for (const product of products) {
    counts[resolveProductSpecStatus(product)] += 1;
  }
  return counts;
}

/** Display value for resume — empty fields become "-". */
export function resumeField(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || "-";
}

export function formatMm(value: string): string {
  const trimmed = value.trim();
  return trimmed ? `${trimmed} mm` : "-";
}

export function formatKg(value: string): string {
  const trimmed = value.trim();
  return trimmed ? `${trimmed} kg` : "-";
}

export function formatCartonSize(packaging: PackagingInformation): string {
  const { cartonWidth, cartonDepth, cartonHeight } = packaging;
  if (
    !cartonWidth.trim() &&
    !cartonDepth.trim() &&
    !cartonHeight.trim()
  ) {
    return "-";
  }
  return `${resumeField(cartonWidth)} × ${resumeField(cartonDepth)} × ${resumeField(cartonHeight)} mm`;
}

export function getProductSpecificationForResume(
  product: Product,
): ProductSpecification {
  return normalizeProductSpecification(product.specification);
}

export interface SpecDisplaySection {
  title: string;
  rows: { label: string; value: string }[];
}

/** Flat rows for history diffs and simple lists. */
export function flattenSpecificationFields(
  specification?: ProductSpecification | null,
): { field: string; value: string }[] {
  const spec = normalizeProductSpecification(specification);
  return [
    { field: "Material", value: spec.material },
    { field: "Connector", value: spec.connector },
    { field: "Voltage", value: spec.voltage },
    { field: "Power", value: spec.power },
    { field: "Flow Rate", value: spec.flowRate },
    { field: "Pressure", value: spec.pressure },
    { field: "Height (H)", value: spec.productDimension.height },
    { field: "Width (W)", value: spec.productDimension.width },
    { field: "Depth (D)", value: spec.productDimension.depth },
    { field: "Weight", value: spec.productDimension.weight },
    { field: "Carton Width", value: spec.packaging.cartonWidth },
    { field: "Carton Depth", value: spec.packaging.cartonDepth },
    { field: "Carton Height", value: spec.packaging.cartonHeight },
    { field: "Gross Weight (GW)", value: spec.packaging.grossWeight },
    { field: "Net Weight (NW)", value: spec.packaging.netWeight },
    { field: "Units per Carton", value: spec.packaging.unitsPerCarton },
    { field: "CBM", value: spec.packaging.cbm },
    { field: "Installation", value: spec.installation },
    { field: "Warranty", value: spec.warranty },
    { field: "Remark", value: spec.remark },
  ];
}

export function getSpecificationRows(
  product: Product,
): { label: string; value: string }[] {
  return flattenSpecificationFields(product.specification).map((row) => ({
    label: row.field,
    value: resumeField(row.value),
  }));
}

/** Structured sections for Product Resume / Spec tab. */
export function getResumeSpecSections(
  product: Product,
): SpecDisplaySection[] {
  const spec = getProductSpecificationForResume(product);
  const dim = spec.productDimension;
  const pack = spec.packaging;

  return [
    {
      title: "General Information",
      rows: [
        { label: "Material", value: resumeField(spec.material) },
        { label: "Connector", value: resumeField(spec.connector) },
      ],
    },
    {
      title: "Electrical",
      rows: [
        { label: "Voltage", value: resumeField(spec.voltage) },
        { label: "Power", value: resumeField(spec.power) },
      ],
    },
    {
      title: "Performance",
      rows: [
        { label: "Flow Rate", value: resumeField(spec.flowRate) },
        { label: "Pressure", value: resumeField(spec.pressure) },
      ],
    },
    {
      title: "Product Dimension",
      rows: [
        { label: "Height", value: formatMm(dim.height) },
        { label: "Width", value: formatMm(dim.width) },
        { label: "Depth", value: formatMm(dim.depth) },
        { label: "Weight", value: formatKg(dim.weight) },
      ],
    },
    {
      title: "Packaging",
      rows: [
        { label: "Carton Size", value: formatCartonSize(pack) },
        { label: "GW", value: formatKg(pack.grossWeight) },
        { label: "NW", value: formatKg(pack.netWeight) },
        { label: "CBM", value: resumeField(pack.cbm) },
        {
          label: "Units / Carton",
          value: resumeField(pack.unitsPerCarton),
        },
      ],
    },
    {
      title: "Installation",
      rows: [{ label: "Installation", value: resumeField(spec.installation) }],
    },
    {
      title: "Warranty",
      rows: [{ label: "Warranty", value: resumeField(spec.warranty) }],
    },
    {
      title: "Remark",
      rows: [{ label: "Remark", value: resumeField(spec.remark) }],
    },
  ];
}
