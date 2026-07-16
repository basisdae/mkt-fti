/** Supabase Auth user not created in Dashboard (or no session cookies). */
export const GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE =
  "บัญชีนี้ยังไม่ได้เปิดสิทธิ์ Gift Plans";

/** App login OK but Supabase Auth password does not match MKT HQ password. */
export const GIFT_PLAN_AUTH_PASSWORD_MISMATCH_MESSAGE =
  "รหัสผ่าน Supabase Auth ไม่ตรงกับบัญชี MKT HQ กรุณาติดต่อผู้ดูแลระบบเพื่อตั้งรหัสผ่านให้ตรงกัน";

export const GIFT_PLAN_AUTH_NOT_CONFIRMED_MESSAGE =
  "บัญชี Supabase Auth ยังไม่ได้ยืนยัน กรุณาติดต่อผู้ดูแลระบบ";

export const GIFT_PLAN_AUTH_SESSION_EXPIRED_MESSAGE =
  "Supabase session หมดอายุ กรุณา Sign out แล้ว Sign in ใหม่";

export type SupabaseAuthBridgeErrorCode =
  | "not_configured"
  | "not_provisioned"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "session_expired"
  | "unknown";

export type SupabaseAuthBridgeResult = {
  linked: boolean;
  errorCode: SupabaseAuthBridgeErrorCode | null;
  message: string | null;
};

type SignInErrorLike = {
  message?: string;
  code?: string;
  status?: number;
};

export function classifySupabaseSignInError(
  error: SignInErrorLike | null | undefined,
): SupabaseAuthBridgeErrorCode {
  if (!error) return "unknown";

  const code = String(error.code ?? "").toLowerCase();
  const message = String(error.message ?? "").toLowerCase();

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "email_not_confirmed";
  }
  if (
    code === "invalid_credentials" ||
    code === "invalid_grant" ||
    message.includes("invalid login credentials")
  ) {
    return "invalid_credentials";
  }
  if (code === "user_not_found" || message.includes("user not found")) {
    return "not_provisioned";
  }

  return "unknown";
}

export function messageForBridgeError(
  code: SupabaseAuthBridgeErrorCode | null | undefined,
  options?: { afterAppLogin?: boolean },
): string {
  switch (code) {
    case "invalid_credentials":
      return options?.afterAppLogin
        ? GIFT_PLAN_AUTH_PASSWORD_MISMATCH_MESSAGE
        : GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE;
    case "email_not_confirmed":
      return GIFT_PLAN_AUTH_NOT_CONFIRMED_MESSAGE;
    case "not_provisioned":
    case "not_configured":
    case "unknown":
      return GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE;
    case "session_expired":
      return GIFT_PLAN_AUTH_SESSION_EXPIRED_MESSAGE;
    default:
      return GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE;
  }
}

export function resolveGiftPlanAuthError(session: {
  supabaseAuthLinked?: boolean;
  supabaseAuthBridgeError?: SupabaseAuthBridgeErrorCode | null;
}): string {
  if (session.supabaseAuthLinked === true) {
    return GIFT_PLAN_AUTH_SESSION_EXPIRED_MESSAGE;
  }
  return messageForBridgeError(session.supabaseAuthBridgeError, {
    afterAppLogin: true,
  });
}
