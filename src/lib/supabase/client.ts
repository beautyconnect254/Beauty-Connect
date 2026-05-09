import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
}
