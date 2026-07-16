import type { BulletItem } from "@/lib/seminar-planner-bullets";

export const SEMINAR_EVENT_STATUSES = [
  "idea",
  "planning",
  "pending_review",
  "needs_revision",
  "approved",
  "ready_to_execute",
  "completed",
  "on_hold",
] as const;

export type SeminarEventStatus = (typeof SEMINAR_EVENT_STATUSES)[number];

export const SEMINAR_EVENT_FORMATS = ["on_site", "online", "hybrid"] as const;

export type SeminarEventFormat = (typeof SEMINAR_EVENT_FORMATS)[number];

export interface SeminarLibSimpleMasterRow {
  id: string;
  seed_key: string | null;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeminarLibSpeakerRow {
  id: string;
  seed_key: string | null;
  name: string;
  role_hint: string;
  sort_order: number;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeminarLibCategoryRow {
  id: string;
  seed_key: string | null;
  name: string;
  description: string;
  color_hint: string;
  sort_order: number;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeminarLibSessionRow {
  id: string;
  seed_key: string | null;
  category_name: string;
  title: string;
  recommended_format: string;
  recommended_minutes: number | null;
  recommended_speaker: string;
  detail_bullets: BulletItem[];
  objectives_bullets: BulletItem[];
  outcomes_bullets: BulletItem[];
  target_group_names: string[];
  sort_order: number;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeminarLibSimpleMasterInput {
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface SeminarLibSpeakerInput {
  name: string;
  role_hint?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface SeminarLibCategoryInput {
  name: string;
  description?: string;
  color_hint?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface SeminarLibSessionInput {
  category_name?: string;
  title: string;
  recommended_format?: string;
  recommended_minutes?: number | null;
  recommended_speaker?: string;
  detail_bullets?: BulletItem[];
  objectives_bullets?: BulletItem[];
  outcomes_bullets?: BulletItem[];
  target_group_names?: string[];
  sort_order?: number;
  is_active?: boolean;
}

export type SeminarSessionLibrarySortKey =
  | "title"
  | "sort_order"
  | "updated_at"
  | "recommended_minutes";

export interface SeminarEventRow {
  id: string;
  seed_key: string | null;
  title: string;
  event_type: string;
  start_date: string | null;
  end_date: string | null;
  daily_start_time: string | null;
  daily_end_time: string | null;
  venue: string;
  event_format: SeminarEventFormat;
  estimated_attendees: number | null;
  owner: string;
  team_members: string;
  status: SeminarEventStatus;
  notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by_email: string | null;
  updated_by_email: string | null;
}

export interface SeminarEventSummary {
  id: string;
  title: string;
  event_type: string;
  start_date: string | null;
  end_date: string | null;
  event_format: SeminarEventFormat;
  status: SeminarEventStatus;
  owner: string;
  is_archived: boolean;
  session_count: number;
  total_minutes: number;
  updated_at: string;
}

export interface SeminarAgendaItemRow {
  id: string;
  seed_key: string | null;
  event_id: string;
  library_session_id: string | null;
  sort_order: number;
  title: string;
  category_name: string;
  format_name: string;
  session_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  primary_speaker: string;
  co_speakers: string;
  detail_bullets: BulletItem[];
  objectives_bullets: BulletItem[];
  outcomes_bullets: BulletItem[];
  target_group_names: string[];
  team_notes: string;
  owner_name: string;
  status_name: string;
  is_parallel: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeminarEventInput {
  title: string;
  event_type?: string;
  start_date?: string | null;
  end_date?: string | null;
  daily_start_time?: string | null;
  daily_end_time?: string | null;
  venue?: string;
  event_format?: SeminarEventFormat;
  estimated_attendees?: number | null;
  owner?: string;
  team_members?: string;
  status?: SeminarEventStatus;
  notes?: string;
  target_group_ids?: string[];
  purpose_ids?: string[];
}

export interface SeminarAgendaItemInput {
  id?: string;
  library_session_id?: string | null;
  sort_order: number;
  title: string;
  category_name?: string;
  format_name?: string;
  session_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  primary_speaker?: string;
  co_speakers?: string;
  detail_bullets?: BulletItem[];
  objectives_bullets?: BulletItem[];
  outcomes_bullets?: BulletItem[];
  target_group_names?: string[];
  team_notes?: string;
  owner_name?: string;
  status_name?: string;
  is_parallel?: boolean;
}

export interface SeminarEventBundle {
  event: SeminarEventRow;
  target_group_ids: string[];
  purpose_ids: string[];
  agenda_items: SeminarAgendaItemRow[];
}

/** Thai error messages for Seminar Planner server actions. */
export const SEMINAR_PLANNER_ERRORS = {
  noPermissionView: "คุณไม่มีสิทธิ์เข้าถึง Seminar Planner",
  noPermissionEdit: "คุณไม่มีสิทธิ์แก้ไข Seminar Planner",
  nameRequired: "กรุณาระบุชื่อ",
  titleRequired: "กรุณาระบุชื่อหัวข้อ",
  sessionTitleRequired: "กรุณาระบุชื่อเซสชัน",
  eventTitleRequired: "กรุณาระบุชื่องานสัมมนา",
  notFound: "ไม่พบรายการ",
  eventNotFound: "ไม่พบงานสัมมนา",
  sessionNotFound: "ไม่พบเซสชันในคลัง",
  agendaItemNotFound: "ไม่พบรายการในวาระ",
  createFailed: "ไม่สามารถสร้างรายการได้",
  eventCreateFailed: "ไม่สามารถสร้างงานสัมมนาได้",
  duplicateFailed: "ไม่สามารถทำสำเนาได้",
  eventDeleteFailed: "ไม่สามารถลบงานสัมมนาได้",
  inUseArchive:
    "รายการนี้ถูกใช้งานอยู่ ไม่สามารถลบได้ กรุณาเก็บถาวรแทน",
  copySuffix: " (สำเนา)",
} as const;
