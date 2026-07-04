import { APP_ROLE_LABELS, isAppRole } from "@/lib/auth/roles";
import { readSessionFromStorage } from "@/lib/auth/session";
import { formatProductBrand } from "@/lib/brand-strategy";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { getEvaluationTotalScore } from "@/lib/evaluation-scorecard";
import { generateId } from "@/lib/generate-id";
import {
  getIsoCertifications,
  getRegulatoryCertifications,
} from "@/lib/product-certification";
import {
  flattenSpecificationFields,
  PRODUCT_SPEC_STATUS_LABELS,
  resolveProductSpecStatus,
} from "@/lib/product-specification";
import type { ProductCreateBundle } from "@/lib/repositories/types";
import type {
  ProductHistoryChange,
  ProductHistoryEntry,
} from "@/types/product-history";
import type {
  Product,
  ProductEvaluationScorecard,
  ProductGalleryImage,
  ProductPriceOption,
  ProductSpecStatus,
} from "@/types/product";

export const PRODUCT_HISTORY_STORAGE_KEY = "mkt-fti-product-history";

function display(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "—";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value
      .map((item) => display(item))
      .filter((item) => item !== "—")
      .join(", ");
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function pushChange(
  changes: ProductHistoryChange[],
  field: string,
  oldValue: unknown,
  newValue: unknown,
) {
  const oldText = display(oldValue);
  const newText = display(newValue);
  if (oldText === newText) return;
  changes.push({ field, oldValue: oldText, newValue: newText });
}

function getActor() {
  const session = readSessionFromStorage();
  if (!session?.user) {
    return {
      userId: "unknown",
      userName: "Unknown user",
      userRole: "unknown",
    };
  }
  return {
    userId: session.user.id,
    userName: session.user.displayName,
    userRole: session.user.role,
  };
}

function createEntry(
  productId: string,
  action: string,
  changes: ProductHistoryChange[],
): ProductHistoryEntry | null {
  if (changes.length === 0) return null;
  const actor = getActor();
  return {
    id: generateId(),
    productId,
    occurredAt: new Date().toISOString(),
    userId: actor.userId,
    userName: actor.userName,
    userRole: actor.userRole,
    action,
    changes,
  };
}

export function loadProductHistory(): ProductHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRODUCT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ProductHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveProductHistory(entries: ProductHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRODUCT_HISTORY_STORAGE_KEY, JSON.stringify(entries));
}

export function appendProductHistory(
  entries: Array<ProductHistoryEntry | null>,
): ProductHistoryEntry[] {
  const valid = entries.filter((entry): entry is ProductHistoryEntry =>
    Boolean(entry),
  );
  if (valid.length === 0) return loadProductHistory();
  const next = [...valid, ...loadProductHistory()].slice(0, 2000);
  saveProductHistory(next);
  return next;
}

export function listProductHistory(
  productId: string,
): ProductHistoryEntry[] {
  return loadProductHistory()
    .filter((entry) => entry.productId === productId)
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
}

export function removeProductHistory(productId: string): void {
  const next = loadProductHistory().filter(
    (entry) => entry.productId !== productId,
  );
  saveProductHistory(next);
}

function categoryLabel(category: string): string {
  return PRODUCT_CATEGORY_LABELS[category] ?? category;
}

function priceSnapshot(options: ProductPriceOption[]): string {
  if (options.length === 0) return "—";
  return [...options]
    .sort((a, b) => a.moq - b.moq)
    .map(
      (option) =>
        `MOQ ${option.moq}: $${option.usdCost} / GP ${Math.round(option.wholesaleGp * 100)}% / LT ${option.leadTime}`,
    )
    .join(" · ");
}

function gallerySnapshot(images: ProductGalleryImage[] | undefined): string {
  const list = images ?? [];
  if (list.length === 0) return "—";
  return list
    .map((image, index) => {
      const bits = [
        `#${index + 1}`,
        image.isCover ? "cover" : null,
        image.imageType || null,
        image.alt || null,
      ].filter(Boolean);
      return bits.join(" ");
    })
    .join(" · ");
}

function scoreSnapshot(scorecard: ProductEvaluationScorecard): string {
  const total = getEvaluationTotalScore(scorecard);
  const criteria = Object.entries(scorecard.criteria ?? {})
    .map(([id, entry]) => `${id}:${entry.score}`)
    .join(",");
  return `${total}/100 [${criteria}]`;
}

export function buildProductCreatedHistory(
  productId: string,
  productName: string,
): ProductHistoryEntry {
  const actor = getActor();
  return {
    id: generateId(),
    productId,
    occurredAt: new Date().toISOString(),
    userId: actor.userId,
    userName: actor.userName,
    userRole: actor.userRole,
    action: "Product created",
    changes: [
      {
        field: "Product",
        oldValue: "—",
        newValue: productName,
      },
    ],
  };
}

export function buildProductUpdateHistory(
  previous: Product | undefined,
  previousPrices: ProductPriceOption[],
  previousStatus: string | undefined,
  bundle: ProductCreateBundle,
): ProductHistoryEntry[] {
  if (!previous) {
    return [
      buildProductCreatedHistory(bundle.product.id, bundle.product.name),
    ];
  }

  const next = bundle.product;
  const profileChanges: ProductHistoryChange[] = [];
  const supplierChanges: ProductHistoryChange[] = [];
  const certChanges: ProductHistoryChange[] = [];
  const priceChanges: ProductHistoryChange[] = [];

  pushChange(profileChanges, "Product name", previous.name, next.name);
  pushChange(profileChanges, "Product code", previous.code, next.code);
  pushChange(
    profileChanges,
    "Brand",
    formatProductBrand(previous.brand),
    formatProductBrand(next.brand),
  );
  pushChange(
    profileChanges,
    "Category",
    categoryLabel(previous.category),
    categoryLabel(next.category),
  );
  pushChange(
    profileChanges,
    "Description",
    previous.description,
    next.description,
  );
  pushChange(
    profileChanges,
    "Product system",
    previous.productSystem,
    next.productSystem,
  );
  pushChange(
    profileChanges,
    "Latest note",
    previous.latestNote,
    next.latestNote,
  );
  pushChange(
    profileChanges,
    "Pipeline status",
    previousStatus,
    bundle.status.status,
  );

  pushChange(supplierChanges, "Supplier", previous.supplier, next.supplier);
  pushChange(
    supplierChanges,
    "Factory",
    previous.brandStrategy?.factory ?? previous.supplier,
    next.brandStrategy?.factory ?? next.supplier,
  );
  pushChange(
    supplierChanges,
    "Country / factory location",
    previous.factoryLocation,
    next.factoryLocation,
  );
  pushChange(
    supplierChanges,
    "Factory contact",
    previous.factoryContact,
    next.factoryContact,
  );

  pushChange(
    certChanges,
    "ISO",
    getIsoCertifications(previous.certification),
    getIsoCertifications(next.certification),
  );
  pushChange(
    certChanges,
    "Certificate",
    getRegulatoryCertifications(previous.certification),
    getRegulatoryCertifications(next.certification),
  );

  pushChange(
    priceChanges,
    "Pricing / MOQ",
    priceSnapshot(previousPrices),
    priceSnapshot(bundle.priceOptions),
  );

  return [
    createEntry(next.id, "Updated product profile", profileChanges),
    createEntry(next.id, "Changed supplier / factory / country", supplierChanges),
    createEntry(next.id, "Changed ISO / certificate", certChanges),
    createEntry(next.id, "Changed pricing", priceChanges),
  ].filter((entry): entry is ProductHistoryEntry => Boolean(entry));
}

export function buildGalleryHistory(
  productId: string,
  previousImages: ProductGalleryImage[] | undefined,
  nextImages: ProductGalleryImage[],
): ProductHistoryEntry | null {
  const changes: ProductHistoryChange[] = [];
  const prev = previousImages ?? [];
  const prevIds = new Set(prev.map((image) => image.id));
  const nextIds = new Set(nextImages.map((image) => image.id));

  const added = nextImages.filter((image) => !prevIds.has(image.id)).length;
  const removed = prev.filter((image) => !nextIds.has(image.id)).length;

  if (added > 0) {
    pushChange(changes, "Images added", 0, added);
  }
  if (removed > 0) {
    pushChange(changes, "Images removed", removed, 0);
  }

  const prevOrder = prev.map((image) => image.id).join(",");
  const nextOrder = nextImages.map((image) => image.id).join(",");
  if (prevOrder !== nextOrder && added === 0 && removed === 0) {
    pushChange(changes, "Image order", prevOrder || "—", nextOrder || "—");
  }

  const prevCover = prev.find((image) => image.isCover)?.id ?? "—";
  const nextCover = nextImages.find((image) => image.isCover)?.id ?? "—";
  pushChange(changes, "Cover image", prevCover, nextCover);

  // Per-image type / alt changes for shared ids
  for (const image of nextImages) {
    const before = prev.find((item) => item.id === image.id);
    if (!before) continue;
    pushChange(
      changes,
      `Image type (${image.id.slice(0, 8)})`,
      before.imageType ?? "",
      image.imageType ?? "",
    );
    pushChange(
      changes,
      `Image alt (${image.id.slice(0, 8)})`,
      before.alt,
      image.alt,
    );
  }

  if (changes.length === 0) {
    pushChange(
      changes,
      "Gallery",
      gallerySnapshot(prev),
      gallerySnapshot(nextImages),
    );
  }

  const action =
    added > 0 && removed === 0
      ? "Added gallery images"
      : removed > 0 && added === 0
        ? "Removed gallery images"
        : "Updated gallery";

  return createEntry(productId, action, changes);
}

export function buildScorecardHistory(
  productId: string,
  previous: ProductEvaluationScorecard | undefined,
  next: ProductEvaluationScorecard,
): ProductHistoryEntry | null {
  const changes: ProductHistoryChange[] = [];
  if (!previous) {
    pushChange(changes, "Evaluation score", "—", scoreSnapshot(next));
    return createEntry(productId, "Updated evaluation score", changes);
  }

  pushChange(
    changes,
    "Total score",
    getEvaluationTotalScore(previous),
    getEvaluationTotalScore(next),
  );

  for (const [id, entry] of Object.entries(next.criteria)) {
    const before = previous.criteria[id as keyof typeof previous.criteria];
    pushChange(changes, `Score · ${id}`, before?.score, entry.score);
    pushChange(changes, `Note · ${id}`, before?.note ?? "", entry.note ?? "");
  }

  pushChange(
    changes,
    "Overall comment",
    previous.overallComment,
    next.overallComment,
  );
  pushChange(changes, "Next action", previous.nextAction, next.nextAction);

  return createEntry(productId, "Updated evaluation score", changes);
}

export function buildSpecificationHistory(
  productId: string,
  previousSpec: Product["specification"],
  previousStatus: ProductSpecStatus | undefined,
  nextSpec: Product["specification"],
  nextStatus: ProductSpecStatus | undefined,
): ProductHistoryEntry | null {
  const changes: ProductHistoryChange[] = [];
  const before = flattenSpecificationFields(previousSpec);
  const after = flattenSpecificationFields(nextSpec);
  const hadSpec = before.some((row) => Boolean(row.value.trim()));

  for (let index = 0; index < after.length; index += 1) {
    pushChange(
      changes,
      after[index]!.field,
      before[index]?.value ?? "",
      after[index]!.value,
    );
  }

  const prevStatus = resolveProductSpecStatus({
    specification: previousSpec,
    specStatus: previousStatus,
  });
  const nextResolved = resolveProductSpecStatus({
    specification: nextSpec,
    specStatus: nextStatus,
  });
  pushChange(
    changes,
    "Spec status",
    PRODUCT_SPEC_STATUS_LABELS[prevStatus],
    PRODUCT_SPEC_STATUS_LABELS[nextResolved],
  );

  const action = hadSpec
    ? "Updated specification"
    : "Added specification";

  return createEntry(productId, action, changes);
}

export function formatHistoryRole(role: string): string {
  return isAppRole(role) ? APP_ROLE_LABELS[role] : role;
}
