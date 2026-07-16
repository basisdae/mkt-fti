import assert from "node:assert/strict";
import { GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE } from "./auth/gift-plan-auth";

assert.equal(
  GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE,
  "บัญชีนี้ยังไม่ได้รับสิทธิ์ใช้งาน Gift Plans กรุณาติดต่อผู้ดูแลระบบ",
);

console.log("gift-plan-auth: ok");
