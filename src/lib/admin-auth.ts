import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  isValidAdminEmail,
  normalizeAdminEmail,
} from "@/lib/admin-auth-shared";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

export interface AdminSession {
  email: string;
  user: User;
}

export interface AdminWhitelistCheck {
  allowed: boolean;
  error?: string;
  source: "bootstrap" | "database" | "none";
}

const defaultBootstrapAdminEmails = ["brioneroo@gmail.com"];

function getBootstrapAdminEmails() {
  const configuredEmails = process.env.ADMIN_BOOTSTRAP_EMAILS ?? "";

  return new Set(
    [...defaultBootstrapAdminEmails, ...configuredEmails.split(",")]
      .map(normalizeAdminEmail)
      .filter((email) => email && isValidAdminEmail(email)),
  );
}

function isBootstrapAdminEmail(email: string) {
  return getBootstrapAdminEmails().has(normalizeAdminEmail(email));
}

export async function checkAdminEmailWhitelisted(
  supabase: SupabaseClient,
  email: string,
): Promise<AdminWhitelistCheck> {
  const normalizedEmail = normalizeAdminEmail(email);

  const { data, error } = await supabase
    .from("admin_email_whitelist")
    .select("email, active")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (data) {
    return {
      allowed: Boolean(data.active),
      source: "database",
    };
  }

  if (error) {
    return {
      allowed: isBootstrapAdminEmail(normalizedEmail),
      error: error.message,
      source: isBootstrapAdminEmail(normalizedEmail) ? "bootstrap" : "none",
    };
  }

  if (isBootstrapAdminEmail(normalizedEmail)) {
    return {
      allowed: true,
      source: "bootstrap",
    };
  }

  return {
    allowed: false,
    source: "none",
  };
}

export async function isAdminEmailWhitelisted(
  supabase: SupabaseClient,
  email: string,
) {
  const check = await checkAdminEmailWhitelisted(supabase, email);

  return check.allowed;
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

  const whitelistClient = createSupabaseServiceClient() ?? supabase;
  const allowed = await isAdminEmailWhitelisted(whitelistClient, email);

  if (!allowed) {
    return null;
  }

  return {
    email,
    user: data.user,
  };
}
