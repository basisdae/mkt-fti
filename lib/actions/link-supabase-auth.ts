"use server";

import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/service";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findAuthUserByEmail(
  email: string,
): Promise<{ id: string; email: string | undefined } | null> {
  const service = createServiceClient();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email,
    );
    if (match) return { id: match.id, email: match.email };

    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
}

export async function linkSupabaseAuthUserAction(input: {
  email: string;
  password: string;
  role?: string;
  displayName?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isServiceRoleConfigured()) {
    return { ok: false, error: "Service role is not configured." };
  }

  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  try {
    const service = createServiceClient();
    const { data: appUser, error: appUserError } = await service
      .from("app_users")
      .select("email, password, role, display_name, is_active")
      .eq("email", email)
      .maybeSingle();

    if (appUserError) {
      return { ok: false, error: appUserError.message };
    }
    if (!appUser || appUser.password !== password) {
      return { ok: false, error: "Invalid credentials." };
    }
    if (appUser.is_active === false) {
      return { ok: false, error: "Account is inactive." };
    }

    const metadata = {
      role: input.role ?? appUser.role,
      display_name: input.displayName ?? appUser.display_name,
    };

    const { error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (!createError) {
      return { ok: true };
    }

    const alreadyExists = createError.message
      .toLowerCase()
      .includes("already");
    if (!alreadyExists) {
      return { ok: false, error: createError.message };
    }

    const existing = await findAuthUserByEmail(email);
    if (!existing) {
      return {
        ok: false,
        error: "Auth user exists but could not be loaded for password sync.",
      };
    }

    const { error: updateError } = await service.auth.admin.updateUserById(
      existing.id,
      {
        password,
        email_confirm: true,
        user_metadata: metadata,
      },
    );

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Auth link failed.",
    };
  }
}
