import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { USER_ACCESS_TOKEN_COOKIE } from "@/lib/user-auth-shared";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice("bearer ".length).trim();
}

function cookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const tokenCookie = cookies.find((item) =>
    item.startsWith(`${USER_ACCESS_TOKEN_COOKIE}=`),
  );

  if (!tokenCookie) {
    return "";
  }

  return decodeURIComponent(tokenCookie.slice(USER_ACCESS_TOKEN_COOKIE.length + 1));
}

async function getUserForAccessToken(accessToken: string): Promise<User | null> {
  const supabase = createSupabaseServerClient();

  if (!supabase || !accessToken) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(USER_ACCESS_TOKEN_COOKIE)?.value ?? "";

  return getUserForAccessToken(accessToken);
}

export async function getCurrentUserId() {
  const user = await getCurrentUser();

  return user?.id ?? null;
}

export async function getAuthenticatedUserFromRequest(request: Request) {
  const accessToken = bearerToken(request) || cookieToken(request);

  return getUserForAccessToken(accessToken);
}
