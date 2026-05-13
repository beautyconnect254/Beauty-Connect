import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import {
  WORKER_CAPACITY_SETTING_KEY,
  normalizeWorkerCapacityLimit,
} from "@/lib/capacity-rules";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(request: NextRequest) {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    return errorResponse("Admin session required.", 401);
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return errorResponse("Supabase service role is not configured.", 503);
  }

  const body = (await request.json().catch(() => null)) as {
    maxActiveBookingsPerWorker?: unknown;
  } | null;
  const limit = normalizeWorkerCapacityLimit(
    body?.maxActiveBookingsPerWorker,
  );

  const { error } = await supabase.from("admin_settings").upsert({
    key: WORKER_CAPACITY_SETTING_KEY,
    value: limit,
  });

  if (error) {
    return errorResponse(error.message, 500);
  }

  revalidatePath("/admin/capacity");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/bookings/pending/team");
  revalidatePath("/admin/bookings/pending/single");

  return NextResponse.json({
    settings: {
      max_active_bookings_per_worker: limit,
    },
  });
}
