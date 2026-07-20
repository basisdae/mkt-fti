import assert from "node:assert/strict";
import { agendaItemKey } from "./seminar-planner-agenda-keys";
import type { SeminarAgendaItemInput } from "@/types/seminar-planner";

const withId: SeminarAgendaItemInput = {
  id: "uuid-1",
  sort_order: 0,
  title: "A",
};

const withClientKey: SeminarAgendaItemInput = {
  client_key: "client-abc",
  sort_order: 1,
  title: "B",
};

assert.equal(agendaItemKey(withId, 5), "uuid-1");
assert.equal(agendaItemKey(withClientKey, 5), "client-abc");
assert.equal(agendaItemKey({ sort_order: 2, title: "C" }, 3), "agenda-new-3");

console.log("seminar-planner-agenda-keys: ok");
