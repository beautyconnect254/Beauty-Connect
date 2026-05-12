import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { USER_ACCESS_TOKEN_COOKIE } from "@/lib/user-auth-shared";

const ACCESS_TOKEN_MAX_AGE = 60 * 60;

function clearUserCookie(response: NextResponse) {
  response.cookies.set(USER_ACCESS_TOKEN_COOKIE, "", {
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
      { error: "Supabase is not configured for user login." },
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

  if (error || !data.user) {
    return NextResponse.json({ error: "Session is invalid." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });

  response.cookies.set(USER_ACCESS_TOKEN_COOKIE, accessToken, {
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
  clearUserCookie(response);
  return response;
}
