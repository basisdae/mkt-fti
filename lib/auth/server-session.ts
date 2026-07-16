import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE,
  readSessionFromCookieHeader,
} from "@/lib/auth/session";
import type { AuthSession } from "@/types/auth";

export async function getServerSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE);
  if (!sessionCookie?.value) return null;
  return readSessionFromCookieHeader(`${AUTH_SESSION_COOKIE}=${sessionCookie.value}`);
}
