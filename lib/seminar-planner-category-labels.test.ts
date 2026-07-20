import assert from "node:assert/strict";
import {
  formatSeminarCategoryLabel,
  shouldShowSessionStatusOnCard,
} from "@/lib/seminar-planner-category-labels";

assert.equal(formatSeminarCategoryLabel("Corporate Update"), "อัปเดตองค์กร");
assert.equal(formatSeminarCategoryLabel("Product"), "สินค้า");
assert.equal(formatSeminarCategoryLabel("Logistics"), "สนับสนุนงาน");
assert.equal(formatSeminarCategoryLabel(""), null);
assert.equal(formatSeminarCategoryLabel(null), null);

assert.equal(shouldShowSessionStatusOnCard("Confirmed"), false);
assert.equal(shouldShowSessionStatusOnCard("Draft"), true);
assert.equal(shouldShowSessionStatusOnCard(""), false);

console.log("seminar-planner-category-labels.test.ts: ok");
