import { randomBytes, randomUUID } from "node:crypto";

import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import type { TeamWorkType } from "@/lib/types";

export const dynamic = "force-dynamic";

interface TeamBookingPayload {
  type: "team";
  salonName: string;
  contactName: string;
  contactEmail: string;
  contactWhatsapp: string;
  location: string;
  workType: TeamWorkType;
  targetStartDate: string;
  roles: Array<{
    role: string;
    quantity: number;
    minExperience: number;
    experienceLabel: string;
    specialtyIds: string[];
    specialtyNames: string[];
  }>;
}

interface SingleBookingPayload {
  type: "worker";
  workerId: string;
  workerName: string;
  workerRole: string;
  salonName: string;
  contactName: string;
  contactNumber: string;
  location: string;
  preferredStartDate: string;
}

type BookingPayload = TeamBookingPayload | SingleBookingPayload;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function appUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

function tokenCandidate() {
  return randomBytes(12).toString("base64url");
}

async function createTrackingToken(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
) {
  for (let index = 0; index < 8; index += 1) {
    const token = tokenCandidate();
    const { data, error } = await supabase
      .from("bookings")
      .select("id")
      .eq("tracking_token", token)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return token;
    }
  }

  throw new Error("Could not generate a unique tracking token.");
}

function normalizePayload(payload: unknown): BookingPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const input = payload as Record<string, unknown>;

  if (input.type === "team") {
    const roles = Array.isArray(input.roles) ? input.roles : [];
    return {
      type: "team",
      salonName: cleanText(input.salonName),
      contactName: cleanText(input.contactName),
      contactEmail: cleanText(input.contactEmail),
      contactWhatsapp: cleanText(input.contactWhatsapp),
      location: cleanText(input.location),
      workType:
        input.workType === "short-term-contract"
          ? "short-term-contract"
          : "long-term-contract",
      targetStartDate: cleanText(input.targetStartDate),
      roles: roles
        .map((role) => {
          const record = role as Record<string, unknown>;
          const specialtyIds = Array.isArray(record.specialtyIds)
            ? record.specialtyIds.map(cleanText).filter(Boolean)
            : [];
          const specialtyNames = Array.isArray(record.specialtyNames)
            ? record.specialtyNames.map(cleanText).filter(Boolean)
            : [];

          return {
            role: cleanText(record.role),
            quantity: Math.max(Number(record.quantity) || 0, 0),
            minExperience: Math.max(Number(record.minExperience) || 0, 0),
            experienceLabel: cleanText(record.experienceLabel),
            specialtyIds,
            specialtyNames,
          };
        })
        .filter((role) => role.role && role.quantity > 0),
    };
  }

  if (input.type === "worker") {
    return {
      type: "worker",
      workerId: cleanText(input.workerId),
      workerName: cleanText(input.workerName),
      workerRole: cleanText(input.workerRole),
      salonName: cleanText(input.salonName),
      contactName: cleanText(input.contactName),
      contactNumber: cleanText(input.contactNumber),
      location: cleanText(input.location),
      preferredStartDate: cleanText(input.preferredStartDate),
    };
  }

  return null;
}

function validatePayload(payload: BookingPayload) {
  if (payload.type === "team") {
    if (
      !payload.salonName ||
      !payload.contactName ||
      !payload.contactWhatsapp ||
      !payload.location ||
      !payload.targetStartDate
    ) {
      return "Salon name, contact name, phone, location, and start date are required.";
    }

    if (payload.roles.length === 0) {
      return "Choose at least one worker role.";
    }

    return "";
  }

  if (
    !payload.workerId ||
    !payload.salonName ||
    !payload.contactName ||
    !payload.contactNumber ||
    !payload.location
  ) {
    return "Worker, salon name, contact name, phone, and location are required.";
  }

  return "";
}

async function createTeamRequest(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  payload: TeamBookingPayload,
) {
  const teamRequestId = `req-${randomUUID()}`;
  const { error: requestError } = await supabase.from("team_requests").insert({
    id: teamRequestId,
    salon_name: payload.salonName,
    contact_name: payload.contactName,
    contact_email: payload.contactEmail || "not-provided@beautyconnect.local",
    contact_whatsapp: payload.contactWhatsapp,
    location: payload.location,
    verified_only: true,
    work_type: payload.workType,
    urgency: "priority",
    status: "new",
    notes: `Submitted from public team builder. Track with private link.`,
    target_start_date: payload.targetStartDate,
  });

  if (requestError) {
    throw requestError;
  }

  const roleRows = payload.roles.map((role) => ({
    id: `trr-${randomUUID()}`,
    team_request_id: teamRequestId,
    role: role.role,
    quantity: role.quantity,
    min_experience: role.minExperience,
  }));
  const { error: rolesError } = await supabase
    .from("team_request_roles")
    .insert(roleRows);

  if (rolesError) {
    throw rolesError;
  }

  const allSpecialtyIds = Array.from(
    new Set(payload.roles.flatMap((role) => role.specialtyIds)),
  );

  if (allSpecialtyIds.length > 0) {
    const { data: existingSkills } = await supabase
      .from("skills")
      .select("id")
      .in("id", allSpecialtyIds);
    const existingSkillIds = new Set(existingSkills?.map((skill) => skill.id) ?? []);
    const specialtyRows = payload.roles.flatMap((role, index) =>
      role.specialtyIds
        .filter((skillId) => existingSkillIds.has(skillId))
        .map((skillId) => ({
          id: `trrs-${randomUUID()}`,
          team_request_role_id: roleRows[index].id,
          skill_id: skillId,
        })),
    );

    if (specialtyRows.length > 0) {
      const { error: specialtyError } = await supabase
        .from("team_request_role_specialties")
        .insert(specialtyRows);

      if (specialtyError) {
        throw specialtyError;
      }
    }
  }

  return teamRequestId;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Could not create booking.";
}

export async function POST(request: Request) {
  const supabase = createSupabaseServiceClient() ?? createSupabaseServerClient();

  if (!supabase) {
    return Response.json(
      { error: "Booking database is not configured." },
      { status: 500 },
    );
  }

  let payload: BookingPayload | null = null;

  try {
    payload = normalizePayload(await request.json());
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!payload) {
    return Response.json({ error: "Invalid booking request." }, { status: 400 });
  }

  const validationError = validatePayload(payload);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  try {
    const trackingToken = await createTrackingToken(supabase);
    const bookingId = `booking-${randomUUID()}`;
    const bookingDate =
      payload.type === "team"
        ? payload.targetStartDate
        : payload.preferredStartDate || new Date().toISOString().slice(0, 10);
    const teamRequestId =
      payload.type === "team" ? await createTeamRequest(supabase, payload) : null;
    const title =
      payload.type === "team"
        ? `${payload.salonName} team booking`
        : `${payload.workerName || "Worker"} single booking`;
    const requestDetails =
      payload.type === "team"
        ? {
            client: {
              salon_name: payload.salonName,
              contact_name: payload.contactName,
              contact_email: payload.contactEmail,
              contact_whatsapp: payload.contactWhatsapp,
              location: payload.location,
            },
            work_type: payload.workType,
            roles: payload.roles.map((role) => ({
              role: role.role,
              quantity: role.quantity,
              min_experience: role.minExperience,
              experience_label: role.experienceLabel,
              specialty_ids: role.specialtyIds,
              specialty_names: role.specialtyNames,
            })),
          }
        : {
            client: {
              salon_name: payload.salonName,
              contact_name: payload.contactName,
              contact_whatsapp: payload.contactNumber,
              location: payload.location,
            },
            requested_worker: {
              id: payload.workerId,
              name: payload.workerName,
              role: payload.workerRole,
            },
          };
    const notes =
      payload.type === "team"
        ? `${payload.contactName}, ${payload.contactWhatsapp}. ${payload.roles
            .map((role) => `${role.quantity} ${role.role}`)
            .join(", ")}.`
        : `${payload.salonName}. Contact: ${payload.contactName}, ${payload.contactNumber}. Location: ${payload.location}. Requested worker: ${payload.workerName}.`;

    const { error: bookingError } = await supabase.from("bookings").insert({
      id: bookingId,
      tracking_token: trackingToken,
      type: payload.type,
      title,
      status: "pending",
      payment_status: "not_due",
      booking_date: bookingDate,
      team_request_id: teamRequestId,
      notes,
      request_details: requestDetails,
      payment_instructions: null,
    });

    if (bookingError) {
      throw bookingError;
    }

    if (payload.type === "worker") {
      const { data: workerExists } = await supabase
        .from("workers")
        .select("id")
        .eq("id", payload.workerId)
        .maybeSingle();

      if (workerExists) {
        const { error: bookingWorkerError } = await supabase.from("booking_workers").insert({
          booking_id: bookingId,
          worker_id: payload.workerId,
        });

        if (bookingWorkerError) {
          throw bookingWorkerError;
        }
      }
    }

    const trackingUrl = `${appUrl(request)}/track/${trackingToken}`;

    return Response.json({
      bookingId,
      trackingToken,
      trackingUrl,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Booking creation failed:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
