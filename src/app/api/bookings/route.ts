import { randomBytes, randomUUID } from "node:crypto";

import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/booking-workflow";
import {
  WORKER_CAPACITY_SETTING_KEY,
  normalizeWorkerCapacityLimit,
} from "@/lib/capacity-rules";
import { experienceYearsFromMonths } from "@/lib/experience";
import type { TeamWorkType } from "@/lib/types";
import { getAuthenticatedUserFromRequest } from "@/lib/user-auth";

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
    minExperienceMonths: number;
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
type BookingSupabaseClient = NonNullable<
  ReturnType<typeof createSupabaseServiceClient>
>;

const DUPLICATE_WORKER_REQUEST_MESSAGE = "You already requested this worker.";
const CAPACITY_LIMIT_MESSAGE =
  "Worker has reached the active booking capacity limit.";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? Math.max(Math.floor(number), 0) : 0;
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
            quantity: cleanNumber(record.quantity),
            minExperience: cleanNumber(record.minExperience),
            minExperienceMonths: cleanNumber(record.minExperienceMonths),
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
  supabase: BookingSupabaseClient,
  payload: TeamBookingPayload,
  userId: string,
) {
  const teamRequestId = `req-${randomUUID()}`;
  const { error: requestError } = await supabase.from("team_requests").insert({
    id: teamRequestId,
    user_id: userId,
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
    min_experience:
      role.minExperience ||
      experienceYearsFromMonths(role.minExperienceMonths),
    min_experience_months:
      role.minExperienceMonths ||
      Math.max(role.minExperience, 0) * 12,
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

async function getActiveBookingIdsForWorker(
  supabase: BookingSupabaseClient,
  workerId: string,
) {
  const { data: bookingWorkerRows, error: bookingWorkerError } = await supabase
    .from("booking_workers")
    .select("booking_id")
    .eq("worker_id", workerId);

  if (bookingWorkerError) {
    throw bookingWorkerError;
  }

  const bookingIds = Array.from(
    new Set((bookingWorkerRows ?? []).map((item) => item.booking_id)),
  );

  if (bookingIds.length === 0) {
    return [];
  }

  const { data: bookingRows, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .in("id", bookingIds)
    .in("status", [...ACTIVE_BOOKING_STATUSES]);

  if (bookingError) {
    throw bookingError;
  }

  return (bookingRows ?? []).map((booking) => booking.id);
}

async function userHasActiveSingleWorkerBooking(
  supabase: BookingSupabaseClient,
  userId: string,
  workerId: string,
) {
  const { data: bookingRows, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "worker")
    .in("status", [...ACTIVE_BOOKING_STATUSES]);

  if (bookingError) {
    throw bookingError;
  }

  const bookingIds = (bookingRows ?? []).map((booking) => booking.id);

  if (bookingIds.length === 0) {
    return false;
  }

  const { data: duplicateRows, error: duplicateError } = await supabase
    .from("booking_workers")
    .select("booking_id")
    .eq("worker_id", workerId)
    .in("booking_id", bookingIds)
    .limit(1);

  if (duplicateError) {
    throw duplicateError;
  }

  return (duplicateRows ?? []).length > 0;
}

async function getWorkerCapacityLimit(supabase: BookingSupabaseClient) {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", WORKER_CAPACITY_SETTING_KEY)
    .maybeSingle();

  if (error || !data) {
    return normalizeWorkerCapacityLimit(1);
  }

  const value = (data as { value?: unknown }).value;

  if (value && typeof value === "object" && !Array.isArray(value) && "limit" in value) {
    return normalizeWorkerCapacityLimit((value as { limit?: unknown }).limit);
  }

  return normalizeWorkerCapacityLimit(value);
}

async function validateSingleWorkerRequest(
  supabase: BookingSupabaseClient,
  userId: string,
  workerId: string,
) {
  if (await userHasActiveSingleWorkerBooking(supabase, userId, workerId)) {
    return DUPLICATE_WORKER_REQUEST_MESSAGE;
  }

  const [activeBookingIds, capacityLimit] = await Promise.all([
    getActiveBookingIdsForWorker(supabase, workerId),
    getWorkerCapacityLimit(supabase),
  ]);

  if (activeBookingIds.length >= capacityLimit) {
    return CAPACITY_LIMIT_MESSAGE;
  }

  return "";
}

function responseStatusForBookingError(message: string) {
  if (
    message.includes(DUPLICATE_WORKER_REQUEST_MESSAGE) ||
    message.includes(CAPACITY_LIMIT_MESSAGE)
  ) {
    return 409;
  }

  return 500;
}

function normalizeBookingErrorMessage(message: string) {
  if (message.includes(DUPLICATE_WORKER_REQUEST_MESSAGE)) {
    return DUPLICATE_WORKER_REQUEST_MESSAGE;
  }

  if (message.includes(CAPACITY_LIMIT_MESSAGE)) {
    return CAPACITY_LIMIT_MESSAGE;
  }

  return message;
}

export async function GET(request: Request) {
  const supabase = createSupabaseServiceClient() ?? createSupabaseServerClient();

  if (!supabase) {
    return Response.json(
      { error: "Booking database is not configured." },
      { status: 500 },
    );
  }

  const user = await getAuthenticatedUserFromRequest(request);

  if (!user) {
    return Response.json(
      { error: "Sign in before checking a booking." },
      { status: 401 },
    );
  }

  const workerId = cleanText(new URL(request.url).searchParams.get("workerId"));

  if (!workerId) {
    return Response.json({ error: "Worker is required." }, { status: 400 });
  }

  try {
    const duplicate = await userHasActiveSingleWorkerBooking(
      supabase,
      user.id,
      workerId,
    );

    return Response.json({
      duplicate,
      message: duplicate ? DUPLICATE_WORKER_REQUEST_MESSAGE : "",
    });
  } catch (error) {
    const message = getErrorMessage(error);

    return Response.json({ error: message }, { status: 500 });
  }
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

  const user = await getAuthenticatedUserFromRequest(request);

  if (!user) {
    return Response.json(
      { error: "Sign in before creating a booking." },
      { status: 401 },
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
    if (payload.type === "worker") {
      const { data: workerExists, error: workerLookupError } = await supabase
        .from("workers")
        .select("id")
        .eq("id", payload.workerId)
        .maybeSingle();

      if (workerLookupError) {
        throw workerLookupError;
      }

      if (!workerExists) {
        return Response.json({ error: "Worker not found." }, { status: 404 });
      }

      const workerRequestError = await validateSingleWorkerRequest(
        supabase,
        user.id,
        payload.workerId,
      );

      if (workerRequestError) {
        return Response.json({ error: workerRequestError }, { status: 409 });
      }
    }

    const trackingToken = await createTrackingToken(supabase);
    const bookingId = `booking-${randomUUID()}`;
    const bookingDate =
      payload.type === "team"
        ? payload.targetStartDate
        : payload.preferredStartDate || new Date().toISOString().slice(0, 10);
    const teamRequestId =
      payload.type === "team"
        ? await createTeamRequest(supabase, payload, user.id)
        : null;
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
              min_experience_months: role.minExperienceMonths,
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
      user_id: user.id,
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
      const { error: bookingWorkerError } = await supabase.from("booking_workers").insert({
        booking_id: bookingId,
        worker_id: payload.workerId,
      });

      if (bookingWorkerError) {
        await supabase.from("bookings").delete().eq("id", bookingId);
        throw bookingWorkerError;
      }
    }

    const trackingUrl = `${appUrl(request)}/track/${trackingToken}`;

    return Response.json({
      bookingId,
      bookingUrl: `/bookings/${bookingId}`,
      trackingToken,
      trackingUrl,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const normalizedMessage = normalizeBookingErrorMessage(message);
    console.error("Booking creation failed:", normalizedMessage);
    return Response.json(
      { error: normalizedMessage },
      { status: responseStatusForBookingError(message) },
    );
  }
}
