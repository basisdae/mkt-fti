import {
  applyLibrarySessionToAgendaItem,
  cascadeAgendaTimesFromIndex,
  needsLibraryReplaceConfirm,
  replaceAgendaItemFromLibrary,
} from "@/lib/seminar-planner-agenda-replace";
import type {
  SeminarAgendaItemInput,
  SeminarLibSessionRow,
} from "@/types/seminar-planner";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const sessionA: SeminarLibSessionRow = {
  id: "lib-a",
  seed_key: null,
  category_name: "Opening",
  title: "Registration",
  recommended_format: "Activity",
  recommended_minutes: 30,
  recommended_speaker: "MC",
  detail_bullets: [{ id: "d1", text: "Check-in" }],
  objectives_bullets: [],
  outcomes_bullets: [],
  target_group_names: ["All"],
  sort_order: 0,
  is_active: true,
  is_archived: false,
  created_at: "",
  updated_at: "",
};

const sessionB: SeminarLibSessionRow = {
  ...sessionA,
  id: "lib-b",
  title: "Keynote",
  recommended_minutes: 45,
  recommended_speaker: "CEO",
  detail_bullets: [{ id: "d2", text: "Opening talk" }],
};

const baseItem: SeminarAgendaItemInput = {
  id: "agenda-1",
  library_session_id: "lib-a",
  sort_order: 0,
  title: "Registration",
  category_name: "Opening",
  format_name: "Activity",
  session_date: "2026-07-20",
  start_time: "09:00",
  end_time: "09:30",
  duration_minutes: 30,
  primary_speaker: "MC",
  co_speakers: "",
  detail_bullets: [{ id: "d1", text: "Check-in" }],
  objectives_bullets: [],
  outcomes_bullets: [],
  target_group_names: ["All"],
  team_notes: "VIP lane",
  owner_name: "MKT",
  status_name: "Confirmed",
  is_parallel: false,
};

const followItem: SeminarAgendaItemInput = {
  ...baseItem,
  id: "agenda-2",
  library_session_id: "lib-x",
  sort_order: 1,
  title: "Next",
  start_time: "09:30",
  end_time: "10:00",
  duration_minutes: 30,
  team_notes: "",
};

assert(!needsLibraryReplaceConfirm(baseItem, sessionA), "same library id skips confirm");

const customized = {
  ...baseItem,
  detail_bullets: [{ id: "x", text: "Custom note" }],
};
assert(needsLibraryReplaceConfirm(customized, sessionB), "custom bullets need confirm");

const replaced = applyLibrarySessionToAgendaItem(baseItem, sessionB, "2026-07-20");
assert(replaced.title === "Keynote", "title from library");
assert(replaced.team_notes === "VIP lane", "agenda notes preserved");
assert(replaced.start_time === "09:00", "start time preserved");
assert(replaced.status_name === "Confirmed", "status preserved");
assert(replaced.duration_minutes === 45, "duration from library");

const cascaded = replaceAgendaItemFromLibrary(
  [baseItem, followItem],
  0,
  sessionB,
  "2026-07-20",
);
assert(cascaded[0].end_time === "09:45", "end time recalculated");
assert(cascaded[1].start_time === "09:45", "next session shifted");

const parallelFollow: SeminarAgendaItemInput = {
  ...followItem,
  is_parallel: true,
  start_time: "09:30",
};
const parallelResult = cascadeAgendaTimesFromIndex(
  replaceAgendaItemFromLibrary([baseItem, parallelFollow], 0, sessionB, "2026-07-20"),
  0,
);
assert(parallelResult[1].start_time === "09:30", "parallel session not shifted");

console.log("seminar-planner-agenda-replace: all tests passed");
