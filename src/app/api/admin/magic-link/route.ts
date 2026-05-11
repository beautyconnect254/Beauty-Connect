import { NextResponse, type NextRequest } from "next/server";

import { isAdminEmailWhitelisted } from "@/lib/admin-auth";
import { isValidAdminEmail, normalizeAdminEmail } from "@/lib/admin-auth-shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getAppOrigin(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
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
    email?: string;
  } | null;
  const email = normalizeAdminEmail(body?.email ?? "");

  if (!isValidAdminEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid admin email address." },
      { status: 400 },
    );
  }

  const allowed = await isAdminEmailWhitelisted(supabase, email);

  if (!allowed) {
    return NextResponse.json(
      { error: "That email is not on the admin access list." },
      { status: 403 },
    );
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getAppOrigin(request)}/admin`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
