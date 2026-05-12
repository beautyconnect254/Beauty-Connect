import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function requireAdminSupabase() {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    return { error: errorResponse("Admin session required.", 401) };
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return {
      error: errorResponse(
        "SUPABASE_SERVICE_ROLE_KEY is required to update specialties.",
        503,
      ),
    };
  }

  return { supabase };
}

async function ensureRole(
  supabase: SupabaseClient,
  roleName: string,
) {
  const existing = await supabase
    .from("worker_roles")
    .select("id, name")
    .eq("name", roleName)
    .maybeSingle();

  if (existing.data) {
    return existing.data;
  }

  const role = {
    id: `role-${slugify(roleName) || randomUUID()}`,
    name: roleName,
    description: "",
    typical_team_use: "",
  };
  const { data, error } = await supabase
    .from("worker_roles")
    .insert(role)
    .select("id, name")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdminSupabase();

  if (error) {
    return error;
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const type = cleanText(body?.type);

  try {
    if (type === "title") {
      const name = cleanText(body?.name);

      if (!name) {
        return errorResponse("Title speciality name is required.", 400);
      }

      const role = await ensureRole(supabase, name);

      revalidatePath("/admin/specialties");
      revalidatePath("/admin/workers/list");
      revalidatePath("/workers");

      return NextResponse.json({
        role: {
          role: role.name,
          description: "",
          typical_team_use: "",
          specialties: [],
        },
      });
    }

    if (type === "sub-speciality") {
      const roleName = cleanText(body?.role);
      const name = cleanText(body?.name);

      if (!roleName || !name) {
        return errorResponse("Title and sub-speciality names are required.", 400);
      }

      const role = await ensureRole(supabase, roleName);
      const skill = {
        id: `skill-${slugify(role.name)}-${slugify(name) || randomUUID()}`,
        name,
        role: role.name,
      };

      const { error: skillError } = await supabase
        .from("skills")
        .upsert(skill, { onConflict: "id" });

      if (skillError) {
        throw skillError;
      }

      const { error: roleSpecialtyError } = await supabase
        .from("role_specialties")
        .upsert(
          {
            id: `rs-${slugify(role.name)}-${slugify(name) || randomUUID()}`,
            role_id: role.id,
            name,
          },
          { onConflict: "id" },
        );

      if (roleSpecialtyError) {
        throw roleSpecialtyError;
      }

      revalidatePath("/admin/specialties");
      revalidatePath("/admin/workers/list");
      revalidatePath("/workers");

      return NextResponse.json({ skill });
    }

    return errorResponse("Unknown specialty action.", 400);
  } catch (caughtError) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : "Could not update specialties.";

    return errorResponse(message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { supabase, error } = await requireAdminSupabase();

  if (error) {
    return error;
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const roleName = cleanText(body?.role);
  const specialtyId = cleanText(body?.specialtyId);
  const specialtyName = cleanText(body?.specialtyName);

  if (!roleName || (!specialtyId && !specialtyName)) {
    return errorResponse("Title and sub-speciality are required.", 400);
  }

  try {
    const role = await ensureRole(supabase, roleName);

    if (specialtyId) {
      await supabase.from("skills").delete().eq("id", specialtyId);
    }

    if (specialtyName) {
      await supabase
        .from("role_specialties")
        .delete()
        .eq("role_id", role.id)
        .eq("name", specialtyName);
    }

    revalidatePath("/admin/specialties");
    revalidatePath("/admin/workers/list");
    revalidatePath("/workers");

    return NextResponse.json({ ok: true });
  } catch (caughtError) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : "Could not remove sub-speciality.";

    return errorResponse(message, 500);
  }
}
