import assert from "node:assert/strict";
import {
  parseFlexibleTimeInput,
  shiftTimeInputValue,
  calcDurationMinutes,
} from "@/lib/seminar-planner-time";

assert.equal(parseFlexibleTimeInput("14:20"), "14:20");
assert.equal(parseFlexibleTimeInput("1420"), "14:20");
assert.equal(parseFlexibleTimeInput("905"), "09:05");
assert.equal(parseFlexibleTimeInput("09:05"), "09:05");
assert.equal(parseFlexibleTimeInput("00:00"), "00:00");
assert.equal(parseFlexibleTimeInput("23:59"), "23:59");
assert.equal(parseFlexibleTimeInput("14:20 น."), "14:20");
assert.equal(parseFlexibleTimeInput("25:70"), null);
assert.equal(parseFlexibleTimeInput("2460"), null);
assert.equal(parseFlexibleTimeInput(""), null);

assert.equal(shiftTimeInputValue("14:20", 30), "14:50");
assert.equal(shiftTimeInputValue("23:59", 1), "23:59");
assert.equal(shiftTimeInputValue(null, 60), "01:00");

assert.equal(calcDurationMinutes("14:20", "14:50"), 30);
assert.equal(calcDurationMinutes("00:00", "09:05"), 545);
assert.equal(calcDurationMinutes("12:00", "12:00"), 0);

console.log("seminar-planner-time-input.test.ts: ok");
