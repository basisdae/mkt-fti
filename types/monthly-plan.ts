export const MKT_WORK_STATUSES = ["PLAN", "WORK", "DONE"] as const;
export type MktWorkStatus = (typeof MKT_WORK_STATUSES)[number];

export const MKT_WORK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type MktWorkPriority = (typeof MKT_WORK_PRIORITIES)[number];

export interface MktWorkSubtaskRow {
  id: string;
  work_item_id: string;
  title: string;
  is_done: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MktWorkSubtaskInput {
  id?: string;
  title: string;
  is_done: boolean;
  sort_order: number;
}

export interface MktWorkItemRow {
  id: string;
  title: string;
  description: string;
  status: MktWorkStatus;
  priority: MktWorkPriority | null;
  plan_year: number | null;
  plan_month: number | null;
  sort_order: number;
  owner_user_id: string | null;
  collaborator_user_ids: string[];
  start_date: string | null;
  deadline: string | null;
  created_by_email: string;
  created_at: string;
  updated_at: string;
}

export interface MktWorkItemCard extends MktWorkItemRow {
  subtasks: MktWorkSubtaskRow[];
  subtasks_done: number;
  subtasks_total: number;
}

export interface MktWorkItemInput {
  title: string;
  description?: string;
  status?: MktWorkStatus;
  priority?: MktWorkPriority | null;
  plan_year?: number | null;
  plan_month?: number | null;
  sort_order?: number;
  owner_user_id?: string | null;
  collaborator_user_ids?: string[];
}

export interface MktWorkPlacementUpdate {
  id: string;
  plan_year: number | null;
  plan_month: number | null;
  sort_order: number;
}

export interface MktWorkBoardFilters {
  search?: string;
  status?: MktWorkStatus | "all";
  priority?: MktWorkPriority | "all";
  ownerUserId?: string | "all";
  month?: number | "all" | "unplanned";
}

export interface MktWorkAssigneeOption {
  id: string;
  email: string;
  displayName: string;
}

export const MONTHLY_PLAN_ERRORS = {
  notAuthenticated: "กรุณาเข้าสู่ระบบ",
  noPermissionView: "บัญชีนี้ไม่มีสิทธิ์ดูแผนรายเดือน",
  noPermissionEdit: "บัญชีนี้ไม่มีสิทธิ์แก้ไขแผนรายเดือน",
  workNotFound: "ไม่พบงานที่เลือก",
  titleRequired: "กรุณาระบุชื่องาน",
  saveFailed: "บันทึกไม่สำเร็จ",
} as const;
