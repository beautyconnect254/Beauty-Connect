import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import {
  LOCKING_BOOKING_STATUSES,
  defaultPaymentInstructions,
  normalizeCommissionPercentage,
} from "@/lib/booking-workflow";
import {
  WORKER_CAPACITY_SETTING_KEY,
  normalizeWorkerCapacityLimit,
} from "@/lib/capacity-rules";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

type AdminBookingPayload =
  {
    action: "confirm";
    workerIds: string[];
    workerAssignments: AdminWorkerAssignmentPayload[];
  };

interface AdminWorkerAssignmentPayload {
  workerId: string;
  compensationType: "monthly" | "commission";
  salaryExpectation: string;
  commissionPercentage: number | null;
}

interface AdminBookingRow {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  booking_date: string;
  team_request_id: string | null;
  payment_instructions: unknown;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseWorkerAssignments(body: Record<string, unknown>) {
  const rows = Array.isArray(body.workerAssignments)
    ? body.workerAssignments
    : [];
  const assignments = rows
    .map((item) => {
      const record = item as Record<string, unknown>;
      const workerId = cleanText(record.workerId);
      const compensationType =
        record.compensationType === "commission" ? "commission" : "monthly";
      const commissionPercentage = normalizeCommissionPercentage(
        record.commissionPercentage,
      );

      if (!workerId) {
        return null;
      }

      return {
        workerId,
        compensationType,
        salaryExpectation:
          compensationType === "monthly"
            ? cleanText(record.salaryExpectation)
            : "",
        commissionPercentage:
          compensationType === "commission" ? commissionPercentage : null,
      } satisfies AdminWorkerAssignmentPayload;
    })
    .filter((item): item is AdminWorkerAssignmentPayload => Boolean(item));

  if (assignments.length > 0) {
    return assignments;
  }

  return Array.isArray(body.workerIds)
    ? body.workerIds
        .map(cleanText)
        .filter(Boolean)
        .map((workerId) => ({
          workerId,
          compensationType: "monthly" as const,
          salaryExpectation: "",
          commissionPercentage: null,
        }))
    : [];
}

function validateWorkerAssignments(assignments: AdminWorkerAssignmentPayload[]) {
  const seen = new Set<string>();

  for (const assignment of assignments) {
    if (seen.has(assignment.workerId)) {
      return "Each worker can only be assigned once.";
    }

    seen.add(assignment.workerId);

    if (
      assignment.compensationType === "monthly" &&
      !assignment.salaryExpectation
    ) {
      return "Enter salary expectation for monthly workers.";
    }

    if (
      assignment.compensationType === "commission" &&
      assignment.commissionPercentage === null
    ) {
      return "Enter commission percentage for commission workers.";
    }
  }

  return "";
}

async function readPayload(request: NextRequest): Promise<AdminBookingPayload | null> {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!body) {
    return null;
  }

  if (body.action === "confirm") {
    const workerAssignments = parseWorkerAssignments(body);
    const workerIds = workerAssignments.map((assignment) => assignment.workerId);

    return {
      action: "confirm",
      workerIds,
      workerAssignments,
    };
  }

  return null;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function parseCapacitySettingValue(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value) && "limit" in value) {
    return normalizeWorkerCapacityLimit((value as { limit?: unknown }).limit);
  }

  return normalizeWorkerCapacityLimit(value);
}

async function getWorkerCapacityLimit(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
) {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", WORKER_CAPACITY_SETTING_KEY)
    .maybeSingle();

  if (error || !data) {
    return normalizeWorkerCapacityLimit(1);
  }

  return parseCapacitySettingValue((data as { value?: unknown }).value);
}

async function getActiveBookingCounts(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  workerIds: string[],
  excludeBookingId: string,
) {
  const { data: bookingWorkerRows, error: bookingWorkerError } = await supabase
    .from("booking_workers")
    .select("booking_id, worker_id")
    .in("worker_id", workerIds);

  if (bookingWorkerError) {
    throw bookingWorkerError;
  }

  const rows = (bookingWorkerRows ?? []) as Array<{
    booking_id: string;
    worker_id: string;
  }>;
  const bookingIds = Array.from(
    new Set(
      rows
        .map((row) => row.booking_id)
        .filter((bookingId) => bookingId !== excludeBookingId),
    ),
  );

  if (bookingIds.length === 0) {
    return new Map<string, number>();
  }

  const { data: bookingRows, error: bookingError } = await supabase
    .from("bookings")
    .select("id, status, payment_lock_expires_at")
    .in("id", bookingIds)
    .in("status", [...LOCKING_BOOKING_STATUSES]);

  if (bookingError) {
    throw bookingError;
  }

  const activeBookingIds = new Set(
    (bookingRows ?? [])
      .filter(
        (booking) =>
          booking.status === "paid" ||
          new Date(booking.payment_lock_expires_at ?? 0).getTime() > Date.now(),
      )
      .map((booking) => booking.id),
  );
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    if (!activeBookingIds.has(row.booking_id)) {
      return;
    }

    counts.set(row.worker_id, (counts.get(row.worker_id) ?? 0) + 1);
  });

  return counts;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    return errorResponse("Admin session required.", 401);
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return errorResponse("Supabase service role is not configured.", 503);
  }

  const { id } = await context.params;
  const payload = await readPayload(request);

  if (!payload) {
    return errorResponse("Invalid booking action.", 400);
  }

  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .select(
      [
        "id",
        "user_id",
        "type",
        "title",
        "booking_date",
        "team_request_id",
        "payment_instructions",
      ].join(", "),
    )
    .eq("id", id)
    .maybeSingle();
  const booking = bookingData as AdminBookingRow | null;

  if (bookingError || !booking) {
    return errorResponse("Booking not found.", 404);
  }

  if (payload.workerIds.length === 0) {
    return errorResponse("At least one worker is required.", 400);
  }

  if (payload.action === "confirm") {
    const assignmentError = validateWorkerAssignments(payload.workerAssignments);

    if (assignmentError) {
      return errorResponse(assignmentError, 400);
    }

    if (booking.type === "worker") {
      const { data: requestedWorkers, error: requestedWorkersError } =
        await supabase
          .from("booking_workers")
          .select("worker_id")
          .eq("booking_id", id);

      if (requestedWorkersError) {
        return errorResponse(requestedWorkersError.message, 500);
      }

      const requestedWorkerId = (
        (requestedWorkers ?? []) as Array<{ worker_id: string }>
      )[0]?.worker_id;

      if (
        payload.workerIds.length !== 1 ||
        !requestedWorkerId ||
        payload.workerIds[0] !== requestedWorkerId
      ) {
        return errorResponse(
          "Single bookings must confirm the exact requested worker.",
          400,
        );
      }
    }

    try {
      const [capacityLimit, activeCounts] = await Promise.all([
        getWorkerCapacityLimit(supabase),
        getActiveBookingCounts(supabase, payload.workerIds, id),
      ]);
      const blockedWorkerId = payload.workerIds.find(
        (workerId) => (activeCounts.get(workerId) ?? 0) >= capacityLimit,
      );

      if (blockedWorkerId) {
        return errorResponse(
          `Worker ${blockedWorkerId} has reached the active booking capacity limit.`,
          409,
        );
      }
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Could not validate worker capacity.",
        500,
      );
    }

    const instructions =
      booking.payment_instructions ??
      defaultPaymentInstructions({
        id: booking.id,
        type: booking.type === "team" ? "team" : "worker",
        worker_count: payload.workerIds.length,
      });

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "deposit_due",
        payment_instructions: instructions,
      })
      .eq("id", id);

    if (updateError) {
      return errorResponse(updateError.message, 500);
    }

    await supabase.from("booking_workers").delete().eq("booking_id", id);

    const { error: workerError } = await supabase.from("booking_workers").insert(
      payload.workerAssignments.map((assignment) => ({
        booking_id: id,
        worker_id: assignment.workerId,
        compensation_type: assignment.compensationType,
        salary_expectation: assignment.salaryExpectation,
        commission_percentage: assignment.commissionPercentage,
      })),
    );

    if (workerError) {
      const status = workerError.message.includes("capacity") ? 409 : 500;

      return errorResponse(workerError.message, status);
    }

    await supabase.from("payment_verifications").upsert({
      id: `verification-${id}`,
      booking_id: id,
      status: "not_submitted",
      submitted_reference: null,
      verified_by: null,
      verified_at: null,
      notes: "Awaiting Daraja payment callback.",
    });

    await supabase.from("admin_activity_logs").insert({
      id: `activity-${randomUUID()}`,
      type: "booking_confirmed",
      actor: adminSession.email,
      message: `${booking.title} moved from pending to confirmed with compensation terms.`,
      booking_id: id,
      worker_id: null,
    });

    return NextResponse.json({ ok: true });
  }

  return errorResponse(
    "M-Pesa callback is the only source of truth for paid bookings.",
    403,
  );
}
