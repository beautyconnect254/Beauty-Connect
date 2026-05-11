import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  normalizeAdminEmail,
} from "@/lib/admin-auth-shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminSession {
  email: string;
  user: User;
}

export async function isAdminEmailWhitelisted(
  supabase: SupabaseClient,
  email: string,
) {
  const normalizedEmail = normalizeAdminEmail(email);

  const { data, error } = await supabase
    .from("admin_email_whitelist")
    .select("email")
    .eq("email", normalizedEmail)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  const email = data.user?.email ? normalizeAdminEmail(data.user.email) : null;

  if (error || !data.user || !email) {
    return null;
  }

  const allowed = await isAdminEmailWhitelisted(supabase, email);

  if (!allowed) {
    return null;
  }

  return {
    email,
    user: data.user,
  };
}
