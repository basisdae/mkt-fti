import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Refreshes the Supabase Auth session on each request and forwards cookie updates
 * to the response. Does not remove or overwrite the app session cookie.
 */
export async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  if (!isSupabaseConfigured()) return response;

  let nextResponse = response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          nextResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            nextResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    await supabase.auth.getUser();
  } catch {
    // Keep request flowing; Gift Plans actions surface auth errors explicitly.
  }

  return nextResponse;
}
