import assert from "node:assert/strict";
import {
  formatSeminarClockRange,
  formatSeminarClockTime,
  formatSeminarSessionStatusLabel,
  SEMINAR_SESSION_STATUS_LABELS,
  SEMINAR_SESSION_STATUS_UNSET_LABEL,
} from "@/lib/seminar-planner-format";

assert.equal(formatSeminarClockTime("15:42:00"), "15:42 น.");
assert.equal(formatSeminarClockTime("09:05"), "09:05 น.");
assert.equal(formatSeminarClockTime(null), "—");
assert.equal(formatSeminarClockRange("15:42", "16:02"), "15:42–16:02 น.");
assert.equal(formatSeminarClockRange("09:00:00", "09:30:00"), "09:00–09:30 น.");
assert.equal(formatSeminarClockRange(null, null), "—");

assert.equal(formatSeminarSessionStatusLabel(""), SEMINAR_SESSION_STATUS_UNSET_LABEL);
assert.equal(formatSeminarSessionStatusLabel("Confirmed"), "ยืนยันแล้ว");
assert.equal(formatSeminarSessionStatusLabel("Cancel / Hold"), "ยกเลิก / พักไว้");
assert.equal(SEMINAR_SESSION_STATUS_LABELS["Need Detail"], "รอรายละเอียด");

console.log("seminar-planner-format.test.ts: all assertions passed");
