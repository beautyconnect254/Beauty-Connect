import { NextResponse, type NextRequest } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import {
  isValidAdminEmail,
  normalizeAdminEmail,
  type AdminWhitelistRecord,
} from "@/lib/admin-auth-shared";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

const adminColumns = "email, active, added_by, created_at, updated_at";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthorizedSupabase() {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    return {
      adminSession: null,
      response: errorResponse("Admin session required.", 401),
      supabase: null,
    };
  }

  const supabase = createSupabaseServiceClient() ?? createSupabaseServerClient();

  if (!supabase) {
    return {
      adminSession,
      response: errorResponse("Supabase is not configured.", 503),
      supabase: null,
    };
  }

  return {
    adminSession,
    response: null,
    supabase,
  };
}

export async function GET() {
  const { response, supabase } = await getAuthorizedSupabase();

  if (response || !supabase) {
    return response;
  }

  const { data, error } = await supabase
    .from("admin_email_whitelist")
    .select(adminColumns)
    .order("created_at", { ascending: false });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return NextResponse.json({
    admins: (data ?? []) as AdminWhitelistRecord[],
  });
}

export async function POST(request: NextRequest) {
  const { adminSession, response, supabase } = await getAuthorizedSupabase();

  if (response || !supabase || !adminSession) {
    return response;
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
  } | null;
  const email = normalizeAdminEmail(body?.email ?? "");

  if (!isValidAdminEmail(email)) {
    return errorResponse("Enter a valid admin email address.", 400);
  }

  const { data, error } = await supabase
    .from("admin_email_whitelist")
    .upsert(
      {
        email,
        active: true,
        added_by: adminSession.email,
      },
      { onConflict: "email" },
    )
    .select(adminColumns)
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return NextResponse.json({
    admin: data as AdminWhitelistRecord,
  });
}

export async function PATCH(request: NextRequest) {
  const { adminSession, response, supabase } = await getAuthorizedSupabase();

  if (response || !supabase || !adminSession) {
    return response;
  }

  const body = (await request.json().catch(() => null)) as {
    active?: boolean;
    email?: string;
  } | null;
  const email = normalizeAdminEmail(body?.email ?? "");
  const active = body?.active;

  if (!isValidAdminEmail(email) || typeof active !== "boolean") {
    return errorResponse("Admin email and active status are required.", 400);
  }

  if (!active && email === adminSession.email) {
    return errorResponse("You cannot deactivate your own admin access.", 400);
  }

  const { data, error } = await supabase
    .from("admin_email_whitelist")
    .update({
      active,
      added_by: adminSession.email,
    })
    .eq("email", email)
    .select(adminColumns)
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return NextResponse.json({
    admin: data as AdminWhitelistRecord,
  });
}
