import { NextResponse, type NextRequest } from "next/server";

import { isAdminEmailWhitelisted } from "@/lib/admin-auth";
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  normalizeAdminEmail,
} from "@/lib/admin-auth-shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ACCESS_TOKEN_MAX_AGE = 60 * 60;

function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured for admin login." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    accessToken?: string;
  } | null;
  const accessToken = body?.accessToken;

  if (!accessToken) {
    return NextResponse.json({ error: "Missing session token." }, { status: 400 });
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  const email = data.user?.email ? normalizeAdminEmail(data.user.email) : null;

  if (error || !data.user || !email) {
    return NextResponse.json({ error: "Admin session is invalid." }, { status: 401 });
  }

  const allowed = await isAdminEmailWhitelisted(supabase, email);

  if (!allowed) {
    const response = NextResponse.json(
      { error: "That email is not on the admin access list." },
      { status: 403 },
    );
    clearAdminCookie(response);
    return response;
  }

  const response = NextResponse.json({ ok: true, email });
  response.cookies.set(ADMIN_ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearAdminCookie(response);
  return response;
}
