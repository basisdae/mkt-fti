import {
  calcWorkProgress,
  allSubtasksDone,
} from "@/lib/monthly-plan-progress";
import {
  bucketsToPlacementUpdates,
  defaultCollapsedMonthIds,
  formatBucketStatusSummary,
  groupWorkItemsIntoBuckets,
  moveItemBetweenBuckets,
  moveItemToMonthBucket,
  reorderItemInBucket,
  summarizeBucketStatuses,
} from "@/lib/monthly-plan-board";
import { bucketId } from "@/lib/monthly-plan-format";
import { isMonthlyPlanTap } from "@/lib/monthly-plan-dnd";
import type { MktWorkItemCard } from "@/types/monthly-plan";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const sampleItem = (id: string, month: number | null, sort: number): MktWorkItemCard => ({
  id,
  title: `Work ${id}`,
  description: "",
  status: "PLAN",
  priority: null,
  plan_year: month == null ? null : 2026,
  plan_month: month,
  sort_order: sort,
  owner_user_id: null,
  collaborator_user_ids: [],
  start_date: null,
  deadline: null,
  created_by_email: "",
  created_at: "",
  updated_at: "",
  subtasks: [
    { id: "s1", work_item_id: id, title: "A", is_done: true, sort_order: 0, created_at: "", updated_at: "" },
    { id: "s2", work_item_id: id, title: "B", is_done: false, sort_order: 1, created_at: "", updated_at: "" },
  ],
  subtasks_done: 1,
  subtasks_total: 2,
});

const progress = calcWorkProgress(sampleItem("1", null, 0).subtasks);
assert(progress.done === 1 && progress.total === 2 && progress.percent === 50, "progress calc");

assert(
  !allSubtasksDone(sampleItem("1", null, 0).subtasks),
  "not all done yet",
);

const buckets = groupWorkItemsIntoBuckets(
  [sampleItem("a", null, 0), sampleItem("b", 1, 0), sampleItem("c", 1, 1)],
  2026,
);
assert(buckets[bucketId(2026, null)].length === 1, "unplanned bucket");
assert(buckets[bucketId(2026, 1)].length === 2, "january bucket");

const moved = moveItemBetweenBuckets(buckets, "a", bucketId(2026, 2), null);
assert(moved[bucketId(2026, null)].length === 0, "moved out of unplanned");
assert(moved[bucketId(2026, 2)].length === 1, "moved into february");
assert(moved[bucketId(2026, 2)][0].id === "a", "correct item moved");

const updates = bucketsToPlacementUpdates(moved, 2026);
assert(
  updates.some((row) => row.id === "a" && row.plan_month === 2),
  "placement update for moved item",
);

assert(isMonthlyPlanTap({ x: 0, y: 0 }, { x: 4, y: 4 }), "tap within threshold");
assert(!isMonthlyPlanTap({ x: 0, y: 0 }, { x: 0, y: 12 }), "movement starts drag");

const reordered = reorderItemInBucket(moved, "c", "b");
assert(reordered[bucketId(2026, 1)][0].id === "c", "reordered within bucket");

const toAugust = moveItemToMonthBucket(moved, "b", 2026, 8);
assert(toAugust[bucketId(2026, 8)].some((row) => row.id === "b"), "move to month bucket");

const statusCounts = summarizeBucketStatuses([
  sampleItem("1", 1, 0),
  { ...sampleItem("2", 1, 1), status: "WORK" },
  { ...sampleItem("3", 1, 2), status: "DONE" },
]);
assert(
  formatBucketStatusSummary(statusCounts) === "PLAN 1 · WORK 1 · DONE 1",
  "status summary",
);

const yearBuckets = groupWorkItemsIntoBuckets(
  [sampleItem("a", 1, 0), sampleItem("b", 8, 0)],
  2026,
);
const collapsedDefaults = defaultCollapsedMonthIds(2026, yearBuckets);
assert(collapsedDefaults.has(2), "empty month starts collapsed");
assert(!collapsedDefaults.has(8), "future month with work starts expanded");

console.log("monthly-plan-board: all tests passed");
