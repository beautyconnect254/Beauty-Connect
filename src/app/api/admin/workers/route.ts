import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import {
  experienceYearsFromMonths,
  normalizeExperienceMonths,
  type ExperienceUnit,
} from "@/lib/experience";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  AvailabilityStatus,
  SkillRecord,
  WorkType,
  Worker,
  WorkerRole,
} from "@/lib/types";

export const runtime = "nodejs";

const availabilityStatuses: AvailabilityStatus[] = [
  "available",
  "reserved",
  "hired",
];
const workTypes: WorkType[] = ["full-time", "part-time", "contract", "freelance"];

interface WorkerCreatePayload {
  full_name: string;
  whatsapp_number: string;
  id_number: string;
  profile_photo: string;
  portfolio_urls: string[];
  years_of_experience: number;
  experience_months: number;
  bio: string;
  primary_role: WorkerRole;
  location: string;
  selected_skills: SkillRecord[];
  availability_status: AvailabilityStatus;
  listed_publicly: boolean;
}

interface WorkerUpdatePayload {
  worker_id: string;
  whatsapp_number: string;
  profile_photo: string;
  portfolio_urls: string[];
  experience_months: number;
  bio: string;
  primary_role: WorkerRole;
  location: string;
  selected_skills: SkillRecord[];
  availability_status: AvailabilityStatus;
  listed_publicly: boolean;
  salary_expectation: number;
  work_type: WorkType;
  headline: string;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? Math.max(Math.floor(number), 0) : 0;
}

function normalizeExperienceUnit(value: unknown): ExperienceUnit {
  return value === "months" ? "months" : "years";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function normalizePayload(input: unknown): WorkerCreatePayload | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const selectedSkills = Array.isArray(record.selected_skills)
    ? record.selected_skills
        .map((skill) => {
          const skillRecord = skill as Record<string, unknown>;

          return {
            id: cleanText(skillRecord.id),
            name: cleanText(skillRecord.name),
            role: cleanText(skillRecord.role),
          };
        })
        .filter((skill) => skill.id && skill.name && skill.role)
    : [];
  const availability = cleanText(record.availability_status);
  const explicitExperienceMonths = Number(record.experience_months);
  const experienceMonths = Number.isFinite(explicitExperienceMonths)
    ? cleanNumber(explicitExperienceMonths)
    : normalizeExperienceMonths(
        record.experience_value ?? record.years_of_experience,
        normalizeExperienceUnit(record.experience_unit),
      );

  return {
    full_name: cleanText(record.full_name),
    whatsapp_number: cleanText(record.whatsapp_number),
    id_number: cleanText(record.id_number),
    profile_photo: cleanText(record.profile_photo),
    portfolio_urls: Array.isArray(record.portfolio_urls)
      ? record.portfolio_urls.map(cleanText).filter(Boolean)
      : [],
    years_of_experience: experienceYearsFromMonths(experienceMonths),
    experience_months: experienceMonths,
    bio: cleanText(record.bio),
    primary_role: cleanText(record.primary_role),
    location: cleanText(record.location) || "Nairobi",
    selected_skills: selectedSkills,
    availability_status: availabilityStatuses.includes(availability as AvailabilityStatus)
      ? (availability as AvailabilityStatus)
      : "available",
    listed_publicly: Boolean(record.listed_publicly),
  };
}

function validatePayload(payload: WorkerCreatePayload) {
  if (!payload.full_name) {
    return "Worker name is required before saving.";
  }

  if (!payload.whatsapp_number) {
    return "WhatsApp number is required before saving.";
  }

  if (!payload.primary_role) {
    return "Choose a title speciality before saving.";
  }

  if (payload.listed_publicly && !payload.profile_photo) {
    return "Add a profile photo before publishing this worker to /workers.";
  }

  return "";
}

function normalizeUpdatePayload(input: unknown): WorkerUpdatePayload | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const selectedSkills = Array.isArray(record.selected_skills)
    ? record.selected_skills
        .map((skill) => {
          const skillRecord = skill as Record<string, unknown>;

          return {
            id: cleanText(skillRecord.id),
            name: cleanText(skillRecord.name),
            role: cleanText(skillRecord.role),
          };
        })
        .filter((skill) => skill.id && skill.name && skill.role)
    : [];
  const availability = cleanText(record.availability_status);
  const workType = cleanText(record.work_type);
  const explicitExperienceMonths = Number(record.experience_months);
  const experienceMonths = Number.isFinite(explicitExperienceMonths)
    ? cleanNumber(explicitExperienceMonths)
    : normalizeExperienceMonths(
        record.experience_value ?? record.years_of_experience,
        normalizeExperienceUnit(record.experience_unit),
      );

  return {
    worker_id: cleanText(record.worker_id),
    whatsapp_number: cleanText(record.whatsapp_number),
    profile_photo: cleanText(record.profile_photo),
    portfolio_urls: Array.isArray(record.portfolio_urls)
      ? record.portfolio_urls.map(cleanText).filter(Boolean)
      : [],
    experience_months: experienceMonths,
    bio: cleanText(record.bio),
    primary_role: cleanText(record.primary_role),
    location: cleanText(record.location) || "Nairobi",
    selected_skills: selectedSkills,
    availability_status: availabilityStatuses.includes(availability as AvailabilityStatus)
      ? (availability as AvailabilityStatus)
      : "available",
    listed_publicly: Boolean(record.listed_publicly),
    salary_expectation: cleanNumber(record.salary_expectation),
    work_type: workTypes.includes(workType as WorkType)
      ? (workType as WorkType)
      : "contract",
    headline: cleanText(record.headline),
  };
}

function validateUpdatePayload(payload: WorkerUpdatePayload) {
  if (!payload.worker_id) {
    return "Worker ID is required before saving.";
  }

  if (!payload.whatsapp_number) {
    return "WhatsApp number is required before saving.";
  }

  if (!payload.primary_role) {
    return "Choose a primary specialty before saving.";
  }

  if (payload.listed_publicly && !payload.profile_photo) {
    return "Add a profile photo before publishing this worker to /workers.";
  }

  return "";
}

export async function POST(request: NextRequest) {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    return errorResponse("Admin session required.", 401);
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return errorResponse(
      "SUPABASE_SERVICE_ROLE_KEY is required to save workers.",
      503,
    );
  }

  let payload: WorkerCreatePayload | null = null;

  try {
    payload = normalizePayload(await request.json());
  } catch {
    return errorResponse("Invalid worker payload.", 400);
  }

  if (!payload) {
    return errorResponse("Invalid worker payload.", 400);
  }

  const validationError = validatePayload(payload);

  if (validationError) {
    return errorResponse(validationError, 400);
  }

  const workerId = `worker-${slugify(payload.full_name) || "profile"}-${randomUUID().slice(0, 8)}`;
  const verificationStatus = payload.listed_publicly ? "verified" : "pending";
  const bio =
    payload.bio ||
    `${payload.primary_role} available for Beauty Connect staffing.`;
  const headline =
    payload.listed_publicly
      ? `${payload.primary_role} available for booking`
      : `${payload.primary_role} in onboarding`;

  try {
    if (payload.selected_skills.length > 0) {
      const { error: skillsError } = await supabase.from("skills").upsert(
        payload.selected_skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          role: skill.role,
        })),
        { onConflict: "id" },
      );

      if (skillsError) {
        throw skillsError;
      }
    }

    const { error: workerError } = await supabase.from("workers").insert({
      id: workerId,
      full_name: payload.full_name,
      id_number: payload.id_number,
      primary_role: payload.primary_role,
      profile_photo: payload.profile_photo,
      location: payload.location,
      years_of_experience: payload.years_of_experience,
      experience_months: payload.experience_months,
      bio,
      availability_status: payload.availability_status,
      verification_status: verificationStatus,
      salary_expectation: 0,
      work_type: "contract",
      whatsapp_number: payload.whatsapp_number,
      headline,
      featured: false,
      listed_publicly: payload.listed_publicly,
    });

    if (workerError) {
      throw workerError;
    }

    if (payload.selected_skills.length > 0) {
      const { error: workerSkillsError } = await supabase
        .from("worker_skills")
        .insert(
          payload.selected_skills.map((skill) => ({
            id: `ws-${workerId}-${skill.id}`,
            worker_id: workerId,
            skill_id: skill.id,
            proficiency_level: "core",
          })),
        );

      if (workerSkillsError) {
        throw workerSkillsError;
      }
    }

    if (payload.portfolio_urls.length > 0) {
      const { error: portfolioError } = await supabase
        .from("portfolio_images")
        .insert(
          payload.portfolio_urls.map((imageUrl, index) => ({
            id: `pi-${workerId}-${index}`,
            worker_id: workerId,
            image_url: imageUrl,
            caption: `Catalog image ${index + 1}`,
            is_cover: index === 0,
          })),
        );

      if (portfolioError) {
        throw portfolioError;
      }
    }

    const { error: noteError } = await supabase.from("admin_notes").insert({
      id: `note-${workerId}`,
      worker_id: workerId,
      author: adminSession.email,
      note: payload.listed_publicly
        ? "Worker published from admin list worker flow."
        : "Worker added through admin onboarding and kept internal.",
    });

    if (noteError) {
      throw noteError;
    }

    await supabase.from("admin_activity_logs").insert({
      id: `activity-${randomUUID()}`,
      type: "worker_status_updated",
      actor: adminSession.email,
      message: payload.listed_publicly
        ? `${payload.full_name} was listed publicly from admin.`
        : `${payload.full_name} was added to the internal roster.`,
      worker_id: workerId,
      booking_id: null,
    });

    const worker: Worker = {
      id: workerId,
      full_name: payload.full_name,
      id_number: payload.id_number,
      primary_role: payload.primary_role,
      profile_photo: payload.profile_photo,
      location: payload.location,
      years_of_experience: payload.years_of_experience,
      experience_months: payload.experience_months,
      bio,
      availability_status: payload.availability_status,
      verification_status: verificationStatus,
      salary_expectation: 0,
      work_type: "contract",
      whatsapp_number: payload.whatsapp_number,
      headline,
      featured: false,
      featured_status: "off",
      featured_expires_at: null,
      featured_frequency: 0,
      featured_priority_score: 0,
      listed_publicly: payload.listed_publicly,
      skills: payload.selected_skills,
      portfolio: payload.portfolio_urls.map((imageUrl, index) => ({
        id: `pi-${workerId}-${index}`,
        worker_id: workerId,
        image_url: imageUrl,
        caption: `Catalog image ${index + 1}`,
        is_cover: index === 0,
      })),
      verification_documents: [],
      reference_contacts: [],
      internal_notes: [
        {
          id: `note-${workerId}`,
          worker_id: workerId,
          team_request_id: null,
          staffing_assignment_id: null,
          author: adminSession.email,
          note: payload.listed_publicly
            ? "Worker published from admin list worker flow."
            : "Worker added through admin onboarding and kept internal.",
          created_at: new Date().toISOString(),
        },
      ],
      active_assignment: null,
      active_booking_count: 0,
    };

    revalidatePath("/workers");
    revalidatePath("/admin/workers/list");
    revalidatePath("/admin/workers/active");
    revalidatePath("/admin/dashboard");

    return NextResponse.json({ worker });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save worker.";

    return errorResponse(message, 500);
  }
}

export async function PATCH(request: NextRequest) {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    return errorResponse("Admin session required.", 401);
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return errorResponse(
      "SUPABASE_SERVICE_ROLE_KEY is required to update workers.",
      503,
    );
  }

  let payload: WorkerUpdatePayload | null = null;

  try {
    payload = normalizeUpdatePayload(await request.json());
  } catch {
    return errorResponse("Invalid worker payload.", 400);
  }

  if (!payload) {
    return errorResponse("Invalid worker payload.", 400);
  }

  const validationError = validateUpdatePayload(payload);

  if (validationError) {
    return errorResponse(validationError, 400);
  }

  const { data: existingWorker, error: existingError } = await supabase
    .from("workers")
    .select("id, full_name, id_number, verification_status, featured")
    .eq("id", payload.worker_id)
    .maybeSingle();

  if (existingError || !existingWorker) {
    return errorResponse("Worker not found.", 404);
  }

  const bio =
    payload.bio ||
    `${payload.primary_role} available for Beauty Connect staffing.`;

  try {
    if (payload.selected_skills.length > 0) {
      const { error: skillsError } = await supabase.from("skills").upsert(
        payload.selected_skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          role: skill.role,
        })),
        { onConflict: "id" },
      );

      if (skillsError) {
        throw skillsError;
      }
    }

    const { error: workerError } = await supabase
      .from("workers")
      .update({
        primary_role: payload.primary_role,
        profile_photo: payload.profile_photo,
        location: payload.location,
        years_of_experience: experienceYearsFromMonths(payload.experience_months),
        experience_months: payload.experience_months,
        bio,
        availability_status: payload.availability_status,
        salary_expectation: payload.salary_expectation,
        work_type: payload.work_type,
        whatsapp_number: payload.whatsapp_number,
        headline: payload.headline,
        listed_publicly: payload.listed_publicly,
      })
      .eq("id", payload.worker_id);

    if (workerError) {
      throw workerError;
    }

    await supabase.from("worker_skills").delete().eq("worker_id", payload.worker_id);

    if (payload.selected_skills.length > 0) {
      const { error: workerSkillsError } = await supabase
        .from("worker_skills")
        .insert(
          payload.selected_skills.map((skill) => ({
            id: `ws-${payload.worker_id}-${skill.id}`,
            worker_id: payload.worker_id,
            skill_id: skill.id,
            proficiency_level:
              skill.role === payload.primary_role ? "specialist" : "advanced",
          })),
        );

      if (workerSkillsError) {
        throw workerSkillsError;
      }
    }

    await supabase
      .from("portfolio_images")
      .delete()
      .eq("worker_id", payload.worker_id);

    if (payload.portfolio_urls.length > 0) {
      const { error: portfolioError } = await supabase
        .from("portfolio_images")
        .insert(
          payload.portfolio_urls.map((imageUrl, index) => ({
            id: `pi-${payload.worker_id}-${index}`,
            worker_id: payload.worker_id,
            image_url: imageUrl,
            caption: `Catalog image ${index + 1}`,
            is_cover: index === 0,
          })),
        );

      if (portfolioError) {
        throw portfolioError;
      }
    }

    await supabase.from("admin_activity_logs").insert({
      id: `activity-${randomUUID()}`,
      type: "worker_status_updated",
      actor: adminSession.email,
      message: `${existingWorker.full_name} profile, listing, and availability were updated.`,
      worker_id: payload.worker_id,
      booking_id: null,
    });

    const verificationStatus =
      existingWorker.verification_status === "verified" ||
      existingWorker.verification_status === "rejected"
        ? existingWorker.verification_status
        : "pending";
    const worker: Worker = {
      id: payload.worker_id,
      full_name: existingWorker.full_name,
      id_number: existingWorker.id_number ?? "",
      primary_role: payload.primary_role,
      profile_photo: payload.profile_photo,
      location: payload.location,
      years_of_experience: experienceYearsFromMonths(payload.experience_months),
      experience_months: payload.experience_months,
      bio,
      availability_status: payload.availability_status,
      verification_status: verificationStatus,
      salary_expectation: payload.salary_expectation,
      work_type: payload.work_type,
      whatsapp_number: payload.whatsapp_number,
      headline: payload.headline,
      featured: Boolean(existingWorker.featured),
      featured_status: existingWorker.featured ? "active" : "off",
      featured_expires_at: null,
      featured_frequency: 0,
      featured_priority_score: existingWorker.featured ? 1 : 0,
      listed_publicly: payload.listed_publicly,
      skills: payload.selected_skills,
      portfolio: payload.portfolio_urls.map((imageUrl, index) => ({
        id: `pi-${payload.worker_id}-${index}`,
        worker_id: payload.worker_id,
        image_url: imageUrl,
        caption: `Catalog image ${index + 1}`,
        is_cover: index === 0,
      })),
      verification_documents: [],
      reference_contacts: [],
      internal_notes: [],
      active_assignment: null,
      active_booking_count: 0,
    };

    revalidatePath("/workers");
    revalidatePath("/admin/workers/list");
    revalidatePath("/admin/workers/active");
    revalidatePath("/admin/dashboard");

    return NextResponse.json({ worker });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update worker.";

    return errorResponse(message, 500);
  }
}
