import {
  inferAgendaEventDate,
  resolveEventAndAgendaDates,
  syncAgendaItemsToEventDate,
} from "@/lib/seminar-planner-agenda-date";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(
  inferAgendaEventDate([
    { session_date: "2026-09-07" },
    { session_date: "2026-09-07" },
    { session_date: "2026-09-08" },
  ]) === "2026-09-07",
  "picks most common legacy date",
);

const resolved = resolveEventAndAgendaDates(null, [
  {
    id: "1",
    event_id: "e1",
    library_session_id: null,
    sort_order: 0,
    title: "A",
    category_name: "",
    format_name: "",
    session_date: "2026-09-07",
    start_time: "09:00",
    end_time: "09:30",
    duration_minutes: 30,
    primary_speaker: "",
    co_speakers: "",
    detail_bullets: [],
    objectives_bullets: [],
    outcomes_bullets: [],
    target_group_names: [],
    team_notes: "",
    owner_name: "",
    status_name: "",
    is_parallel: false,
    created_at: "",
    updated_at: "",
  },
]);

assert(resolved.eventDate === "2026-09-07", "legacy infer event date");
assert(resolved.agendaItems[0].session_date === "2026-09-07", "legacy sync items");

const synced = syncAgendaItemsToEventDate(
  [{ session_date: "2026-09-07" }, { session_date: "2026-09-08" }],
  "2026-10-01",
);
assert(
  synced.every((item) => item.session_date === "2026-10-01"),
  "sync all items to project date",
);

console.log("seminar-planner-agenda-date: all tests passed");
