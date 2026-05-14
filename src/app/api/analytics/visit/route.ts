import { NextResponse, type NextRequest } from "next/server";

import { getAuthenticatedUserFromRequest } from "@/lib/user-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const sessionId = cleanText(body?.sessionId);

  if (!sessionId) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  const user = await getAuthenticatedUserFromRequest(request);
  const { error } = await supabase.from("site_visits").insert({
    user_id: user?.id ?? null,
    session_id: sessionId,
    path: cleanText(body?.path, "/").slice(0, 512),
    referrer: cleanText(body?.referrer).slice(0, 512),
    user_agent: cleanText(request.headers.get("user-agent")).slice(0, 512),
  });

  if (error) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  return NextResponse.json({ ok: true, tracked: true });
}
