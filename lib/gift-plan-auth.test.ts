import assert from "node:assert/strict";
import {
  classifySupabaseSignInError,
  GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE,
  GIFT_PLAN_AUTH_PASSWORD_MISMATCH_MESSAGE,
  GIFT_PLAN_AUTH_SESSION_EXPIRED_MESSAGE,
  messageForBridgeError,
  resolveGiftPlanAuthError,
} from "./auth/gift-plan-auth";

assert.equal(
  GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE,
  "บัญชีนี้ยังไม่ได้เปิดสิทธิ์ Gift Plans",
);

assert.equal(
  classifySupabaseSignInError({ code: "invalid_credentials" }),
  "invalid_credentials",
);
assert.equal(
  classifySupabaseSignInError({ code: "email_not_confirmed" }),
  "email_not_confirmed",
);

assert.equal(
  messageForBridgeError("invalid_credentials", { afterAppLogin: true }),
  GIFT_PLAN_AUTH_PASSWORD_MISMATCH_MESSAGE,
);
assert.equal(
  messageForBridgeError("not_provisioned"),
  GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE,
);

assert.equal(
  resolveGiftPlanAuthError({
    supabaseAuthLinked: false,
    supabaseAuthBridgeError: "invalid_credentials",
  }),
  GIFT_PLAN_AUTH_PASSWORD_MISMATCH_MESSAGE,
);
assert.equal(
  resolveGiftPlanAuthError({
    supabaseAuthLinked: true,
    supabaseAuthBridgeError: null,
  }),
  GIFT_PLAN_AUTH_SESSION_EXPIRED_MESSAGE,
);

console.log("gift-plan-auth: ok");
