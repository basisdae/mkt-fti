import assert from "node:assert/strict";
import {
  buildSeminarAgendaDocument,
  isAgendaDocumentDraft,
  isAgendaItemIncompleteForExport,
} from "@/lib/seminar-agenda-document";
import type { SeminarAgendaItemInput } from "@/types/seminar-planner";

function sampleItem(
  overrides: Partial<SeminarAgendaItemInput> = {},
): SeminarAgendaItemInput {
  return {
    sort_order: 1,
    title: "Opening & Welcome",
    category_name: "Corporate Update",
    format_name: "Keynote",
    start_time: "09:00",
    end_time: "09:20",
    duration_minutes: 20,
    primary_speaker: "Moderator",
    owner_name: "Internal Team",
    status_name: "Draft",
    agenda_short_detail: "กล่าวต้อนรับผู้เข้าร่วมงานและแนะนำภาพรวมกิจกรรม",
    ...overrides,
  };
}

const event = {
  title: "FTI CONNECT 2026",
  start_date: "2026-09-07",
  end_date: "2026-09-07",
  venue: "Bangkok Convention Center",
  event_format: "on_site" as const,
};

assert.equal(isAgendaItemIncompleteForExport(sampleItem()), false);
assert.equal(
  isAgendaItemIncompleteForExport(sampleItem({ title: "" })),
  true,
);
assert.equal(
  isAgendaItemIncompleteForExport(sampleItem({ end_time: "" })),
  true,
);
assert.equal(
  isAgendaItemIncompleteForExport(sampleItem({ owner_name: "" })),
  false,
);

const model = buildSeminarAgendaDocument({
  event,
  items: [
    sampleItem(),
    sampleItem({
      sort_order: 2,
      title: "Coffee Break",
      category_name: "Logistics",
      format_name: "Break",
      start_time: "09:20",
      end_time: "09:35",
      duration_minutes: 15,
      primary_speaker: "HR / Training",
      owner_name: "Ops Team",
      status_name: "Confirmed",
      agenda_short_detail: "",
    }),
  ],
});

assert.equal(model.isDraft, false);
assert.equal(model.sessions.length, 2);
assert.equal(model.topicCountLabel, "2 หัวข้อ");
assert.equal(model.sessions[0].title, "Opening & Welcome");
assert.equal(model.sessions[0].timeRange, "09:00–09:20 น.");
assert.equal(model.sessions[0].shortDetail, sampleItem().agenda_short_detail);
assert.equal(model.sessions[0].categoryName, "อัปเดตองค์กร");
assert.equal(model.sessions[1].categoryVisual.accent, "#16a34a");
assert.equal(model.sessions[1].shortDetail, null);

const serialized = JSON.stringify(model);
assert.ok(serialized.includes("09:00–09:20 น."));
assert.ok(!serialized.includes("Moderator"));
assert.ok(!serialized.includes("30 นาที"));
assert.ok(!serialized.includes('"Draft"'));
assert.ok(!serialized.includes("ข้อมูลไม่ครบ"));
assert.ok(!serialized.includes("ผู้รับผิดชอบ"));
assert.ok(!serialized.includes("Internal Team"));

const draftModel = buildSeminarAgendaDocument({
  event,
  items: [sampleItem({ end_time: "" })],
});
assert.equal(draftModel.isDraft, true);
assert.equal(draftModel.sessions[0].timeRange, "ยังไม่กำหนดเวลา");
assert.equal(isAgendaDocumentDraft([sampleItem({ end_time: "" })]), true);

console.log("seminar-agenda-document.test.ts: ok");
