import {
  canWriteWithSupabaseAuth,
  isSupabaseAuthGuardMessage,
} from "@/lib/auth/gift-plan-auth";
import type { AuthSession } from "@/types/auth";

/** Skip inline errors already shown by the global Supabase auth guard banner. */
export function reportActionError(
  error: string,
  setError: (value: string | null) => void,
): void {
  if (isSupabaseAuthGuardMessage(error)) return;
  setError(error);
}

export function canEditWithSupabaseAuth(
  canEdit: boolean,
  session: AuthSession | null | undefined,
): boolean {
  return canEdit && canWriteWithSupabaseAuth(session);
}
