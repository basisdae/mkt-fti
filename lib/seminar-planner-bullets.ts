export interface BulletItem {
  id: string;
  text: string;
  sort_order: number;
}

function newBulletId(): string {
  return crypto.randomUUID();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function normalizeBullets(input: unknown): BulletItem[] {
  if (!Array.isArray(input)) return [];

  const items: BulletItem[] = [];
  for (const entry of input) {
    const row = asRecord(entry);
    if (!row) continue;

    const text = String(row.text ?? "").trim();
    if (!text) continue;

    const sortOrder = Number(row.sort_order);
    items.push({
      id: String(row.id ?? newBulletId()),
      text,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : items.length,
    });
  }

  return reorderBullets(items);
}

export function duplicateBullets(bullets: BulletItem[]): BulletItem[] {
  return reorderBullets(
    bullets.map((bullet) => ({
      id: newBulletId(),
      text: bullet.text,
      sort_order: bullet.sort_order,
    })),
  );
}

export function reorderBullets(bullets: BulletItem[]): BulletItem[] {
  return [...bullets]
    .sort((a, b) => a.sort_order - b.sort_order || a.text.localeCompare(b.text))
    .map((bullet, index) => ({
      ...bullet,
      sort_order: index,
    }));
}

export function bulletsToJson(bullets: BulletItem[]): BulletItem[] {
  return normalizeBullets(bullets);
}
