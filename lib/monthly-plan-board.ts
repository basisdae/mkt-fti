import type { MktWorkItemCard, MktWorkPlacementUpdate } from "@/types/monthly-plan";
import { bucketId, parseBucketId } from "@/lib/monthly-plan-format";

export type MonthlyPlanBuckets = Record<string, MktWorkItemCard[]>;

export function createEmptyBuckets(year: number): MonthlyPlanBuckets {
  const buckets: MonthlyPlanBuckets = {
    [bucketId(year, null)]: [],
  };
  for (let month = 1; month <= 12; month += 1) {
    buckets[bucketId(year, month)] = [];
  }
  return buckets;
}

export function groupWorkItemsIntoBuckets(
  items: MktWorkItemCard[],
  year: number,
): MonthlyPlanBuckets {
  const buckets = createEmptyBuckets(year);

  for (const item of items) {
    if (item.plan_month == null) {
      buckets[bucketId(year, null)].push(item);
      continue;
    }
    if (item.plan_year === year) {
      const key = bucketId(year, item.plan_month);
      if (buckets[key]) buckets[key].push(item);
    }
  }

  for (const key of Object.keys(buckets)) {
    buckets[key].sort((a, b) => a.sort_order - b.sort_order);
  }

  return buckets;
}

export function flattenBuckets(items: MonthlyPlanBuckets): MktWorkItemCard[] {
  return Object.values(items).flat();
}

export function findBucketForItem(
  buckets: MonthlyPlanBuckets,
  itemId: string,
): string | null {
  for (const [key, list] of Object.entries(buckets)) {
    if (list.some((item) => item.id === itemId)) return key;
  }
  return null;
}

export function bucketsToPlacementUpdates(
  buckets: MonthlyPlanBuckets,
  year: number,
): MktWorkPlacementUpdate[] {
  const updates: MktWorkPlacementUpdate[] = [];

  for (const [key, list] of Object.entries(buckets)) {
    const parsed = parseBucketId(key);
    if (!parsed || parsed.year !== year) continue;

    list.forEach((item, index) => {
      updates.push({
        id: item.id,
        plan_year: parsed.planMonth == null ? null : year,
        plan_month: parsed.planMonth,
        sort_order: index,
      });
    });
  }

  return updates;
}

export function moveItemBetweenBuckets(
  buckets: MonthlyPlanBuckets,
  activeId: string,
  overBucketKey: string,
  overItemId?: string | null,
): MonthlyPlanBuckets {
  const next: MonthlyPlanBuckets = {};
  for (const [key, list] of Object.entries(buckets)) {
    next[key] = [...list];
  }

  const sourceKey = findBucketForItem(next, activeId);
  if (!sourceKey || !next[overBucketKey]) return buckets;

  const sourceIndex = next[sourceKey].findIndex((item) => item.id === activeId);
  if (sourceIndex < 0) return buckets;

  const [moved] = next[sourceKey].splice(sourceIndex, 1);
  const targetList = next[overBucketKey];

  if (overItemId && overItemId !== activeId) {
    const overIndex = targetList.findIndex((item) => item.id === overItemId);
    targetList.splice(overIndex >= 0 ? overIndex : targetList.length, 0, moved);
  } else {
    targetList.push(moved);
  }

  return next;
}

export function applyPlacementToBuckets(
  buckets: MonthlyPlanBuckets,
  updates: MktWorkPlacementUpdate[],
  year: number,
): MonthlyPlanBuckets {
  const updateMap = new Map(updates.map((update) => [update.id, update]));
  const flat = flattenBuckets(buckets).map((item) => {
    const patch = updateMap.get(item.id);
    if (!patch) return item;
    return {
      ...item,
      plan_year: patch.plan_year,
      plan_month: patch.plan_month,
      sort_order: patch.sort_order,
    };
  });
  return groupWorkItemsIntoBuckets(flat, year);
}

export function cloneBuckets(buckets: MonthlyPlanBuckets): MonthlyPlanBuckets {
  const next: MonthlyPlanBuckets = {};
  for (const [key, list] of Object.entries(buckets)) {
    next[key] = list.map((item) => ({
      ...item,
      subtasks: [...item.subtasks],
      collaborator_user_ids: [...item.collaborator_user_ids],
    }));
  }
  return next;
}
