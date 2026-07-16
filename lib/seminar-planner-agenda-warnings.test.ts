import assert from "node:assert/strict";
import {
  countAgendaOverlaps,
  countIncompleteAgendaItems,
} from "@/lib/seminar-planner-agenda-warnings";
import type { SeminarAgendaItemInput } from "@/types/seminar-planner";

const completeItem: SeminarAgendaItemInput = {
  sort_order: 0,
  title: "Opening",
  start_time: "09:00",
  end_time: "09:30",
  duration_minutes: 30,
  primary_speaker: "CEO",
  owner_name: "Marketing",
  detail_bullets: [],
  objectives_bullets: [],
  outcomes_bullets: [],
  target_group_names: [],
  is_parallel: false,
};

const incompleteItem: SeminarAgendaItemInput = {
  sort_order: 1,
  title: "Break",
  detail_bullets: [],
  objectives_bullets: [],
  outcomes_bullets: [],
  target_group_names: [],
  is_parallel: false,
};

const overlappingA: SeminarAgendaItemInput = {
  id: "a",
  sort_order: 2,
  title: "Session A",
  session_date: "2026-09-07",
  start_time: "10:00",
  end_time: "11:00",
  duration_minutes: 60,
  primary_speaker: "Speaker",
  owner_name: "Owner",
  detail_bullets: [],
  objectives_bullets: [],
  outcomes_bullets: [],
  target_group_names: [],
  is_parallel: false,
};

const overlappingB: SeminarAgendaItemInput = {
  id: "b",
  sort_order: 3,
  title: "Session B",
  session_date: "2026-09-07",
  start_time: "10:30",
  end_time: "11:30",
  duration_minutes: 60,
  primary_speaker: "Speaker",
  owner_name: "Owner",
  detail_bullets: [],
  objectives_bullets: [],
  outcomes_bullets: [],
  target_group_names: [],
  is_parallel: false,
};

assert.equal(countIncompleteAgendaItems([completeItem]), 0);
assert.equal(countIncompleteAgendaItems([completeItem, incompleteItem]), 1);
assert.equal(countAgendaOverlaps([overlappingA, overlappingB]), 1);
assert.equal(
  countAgendaOverlaps([
    { ...overlappingA, is_parallel: true },
    { ...overlappingB, is_parallel: true },
  ]),
  1,
);

console.log("seminar-planner-agenda-warnings: all tests passed");
