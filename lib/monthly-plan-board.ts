import type { MktWorkItemCard, MktWorkPlacementUpdate, MktWorkStatus } from "@/types/monthly-plan";
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

export function reorderItemInBucket(
  buckets: MonthlyPlanBuckets,
  activeId: string,
  overId: string,
): MonthlyPlanBuckets {
  const bucketKey = findBucketForItem(buckets, activeId);
  if (!bucketKey) return buckets;

  const overBucketKey = findBucketForItem(buckets, overId);
  if (bucketKey !== overBucketKey) return buckets;

  const list = [...buckets[bucketKey]];
  const oldIndex = list.findIndex((item) => item.id === activeId);
  const newIndex = list.findIndex((item) => item.id === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return buckets;

  const nextList = [...list];
  const [moved] = nextList.splice(oldIndex, 1);
  nextList.splice(newIndex, 0, moved);

  return {
    ...buckets,
    [bucketKey]: nextList,
  };
}

export function moveItemToMonthBucket(
  buckets: MonthlyPlanBuckets,
  itemId: string,
  year: number,
  planMonth: number | null,
): MonthlyPlanBuckets {
  const targetKey = bucketId(year, planMonth);
  if (!buckets[targetKey]) return buckets;
  return moveItemBetweenBuckets(buckets, itemId, targetKey, null);
}

export function mergeItemsWithServer(
  localItems: MktWorkItemCard[],
  serverItems: MktWorkItemCard[],
  keepPlacementIds: ReadonlySet<string>,
): MktWorkItemCard[] {
  const serverMap = new Map(serverItems.map((item) => [item.id, item]));
  const localMap = new Map(localItems.map((item) => [item.id, item]));
  const merged: MktWorkItemCard[] = [];

  for (const serverItem of serverItems) {
    const localItem = localMap.get(serverItem.id);
    if (!localItem) {
      merged.push(serverItem);
      continue;
    }

    if (keepPlacementIds.has(serverItem.id)) {
      merged.push({
        ...serverItem,
        plan_year: localItem.plan_year,
        plan_month: localItem.plan_month,
        sort_order: localItem.sort_order,
      });
      continue;
    }

    if (serverItem.updated_at > localItem.updated_at) {
      merged.push(serverItem);
      continue;
    }

    merged.push({
      ...localItem,
      subtasks:
        serverItem.subtasks.length >= localItem.subtasks.length
          ? serverItem.subtasks
          : localItem.subtasks,
      subtasks_done: serverItem.subtasks_done,
      subtasks_total: serverItem.subtasks_total,
    });
  }

  for (const localItem of localItems) {
    if (!serverMap.has(localItem.id)) {
      merged.push(localItem);
    }
  }

  return merged;
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

export type MonthlyPlanStatusCounts = Record<MktWorkStatus, number>;

export function summarizeBucketStatuses(
  items: MktWorkItemCard[],
): MonthlyPlanStatusCounts {
  const counts: MonthlyPlanStatusCounts = { PLAN: 0, WORK: 0, DONE: 0 };
  for (const item of items) {
    counts[item.status] += 1;
  }
  return counts;
}

export function formatBucketStatusSummary(
  counts: MonthlyPlanStatusCounts,
): string | null {
  const parts: string[] = [];
  if (counts.PLAN > 0) parts.push(`PLAN ${counts.PLAN}`);
  if (counts.WORK > 0) parts.push(`WORK ${counts.WORK}`);
  if (counts.DONE > 0) parts.push(`DONE ${counts.DONE}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Months that should start collapsed for the given board year. */
export function defaultCollapsedMonthIds(
  year: number,
  buckets: MonthlyPlanBuckets,
): Set<number> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const collapsed = new Set<number>();

  for (let month = 1; month <= 12; month += 1) {
    const items = buckets[bucketId(year, month)] ?? [];
    const hasWork = items.length > 0;
    let expanded = false;

    if (year === currentYear && month === currentMonth) {
      expanded = true;
    } else if (year > currentYear && hasWork) {
      expanded = true;
    } else if (year === currentYear && month > currentMonth && hasWork) {
      expanded = true;
    }

    if (!expanded) {
      collapsed.add(month);
    }
  }

  return collapsed;
}
