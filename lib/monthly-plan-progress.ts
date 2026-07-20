import type { MktWorkSubtaskRow } from "@/types/monthly-plan";

export interface WorkProgressSummary {
  done: number;
  total: number;
  percent: number;
}

export function calcWorkProgress(
  subtasks: Pick<MktWorkSubtaskRow, "is_done">[],
): WorkProgressSummary {
  const total = subtasks.length;
  if (total === 0) {
    return { done: 0, total: 0, percent: 0 };
  }
  const done = subtasks.filter((task) => task.is_done).length;
  return {
    done,
    total,
    percent: Math.round((done / total) * 100),
  };
}

export function allSubtasksDone(
  subtasks: Pick<MktWorkSubtaskRow, "is_done">[],
): boolean {
  return subtasks.length > 0 && subtasks.every((task) => task.is_done);
}
