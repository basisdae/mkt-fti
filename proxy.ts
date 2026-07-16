import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessPath,
  getHomePathForUser,
} from "@/lib/auth/permissions";
import { readSessionFromCookieHeader } from "@/lib/auth/session";
import { refreshSupabaseSession } from "@/lib/supabase/proxy-session";

function forwardRefreshedCookies(
  refreshed: NextResponse,
  target: NextResponse,
): NextResponse {
  refreshed.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  return target;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response = await refreshSupabaseSession(request, response);

  const { pathname } = request.nextUrl;
  const session = readSessionFromCookieHeader(request.headers.get("cookie"));
  const hasSession = Boolean(session?.user);
  const isLoginPage = pathname === "/login";

  if (!hasSession && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return forwardRefreshedCookies(
      response,
      NextResponse.redirect(loginUrl),
    );
  }

  if (hasSession && isLoginPage) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = getHomePathForUser(session?.user);
    homeUrl.search = "";
    return forwardRefreshedCookies(response, NextResponse.redirect(homeUrl));
  }

  if (
    hasSession &&
    session?.user &&
    !canAccessPath(session.user, pathname)
  ) {
    const fallback = request.nextUrl.clone();
    fallback.pathname = getHomePathForUser(session.user);
    fallback.search = "";
    return forwardRefreshedCookies(response, NextResponse.redirect(fallback));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
