import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessPath,
  getHomePathForUser,
} from "@/lib/auth/permissions";
import { readSessionFromCookieHeader } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = readSessionFromCookieHeader(request.headers.get("cookie"));
  const hasSession = Boolean(session?.user);
  const isLoginPage = pathname === "/login";

  if (!hasSession && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isLoginPage) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = getHomePathForUser(session?.user);
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  if (
    hasSession &&
    session?.user &&
    !canAccessPath(session.user, pathname)
  ) {
    const fallback = request.nextUrl.clone();
    fallback.pathname = getHomePathForUser(session.user);
    fallback.search = "";
    return NextResponse.redirect(fallback);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
