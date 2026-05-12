import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { defaultPaymentInstructions } from "@/lib/booking-workflow";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

type AdminBookingPayload =
  | {
      action: "confirm";
      workerIds: string[];
    }
  | {
      action: "verify_payment";
      paymentReference: string;
      workerIds: string[];
    };

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

async function readPayload(request: NextRequest): Promise<AdminBookingPayload | null> {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!body) {
    return null;
  }

  if (body.action === "confirm") {
    const workerIds = Array.isArray(body.workerIds)
      ? body.workerIds.map(cleanText).filter(Boolean)
      : [];

    return {
      action: "confirm",
      workerIds,
    };
  }

  if (body.action === "verify_payment") {
    const workerIds = Array.isArray(body.workerIds)
      ? body.workerIds.map(cleanText).filter(Boolean)
      : [];

    return {
      action: "verify_payment",
      paymentReference: cleanText(body.paymentReference),
      workerIds,
    };
  }

  return null;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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
      payload.workerIds.map((workerId) => ({
        booking_id: id,
        worker_id: workerId,
      })),
    );

    if (workerError) {
      return errorResponse(workerError.message, 500);
    }

    await supabase
      .from("workers")
      .update({ availability_status: "reserved" })
      .in("id", payload.workerIds);

    await supabase.from("payment_verifications").upsert({
      id: `verification-${id}`,
      booking_id: id,
      status: "not_submitted",
      submitted_reference: null,
      verified_by: null,
      verified_at: null,
      notes: "Awaiting manual deposit verification.",
    });

    await supabase.from("admin_activity_logs").insert({
      id: `activity-${randomUUID()}`,
      type: "booking_confirmed",
      actor: adminSession.email,
      message: `${booking.title} moved from pending to confirmed.`,
      booking_id: id,
      worker_id: null,
    });

    return NextResponse.json({ ok: true });
  }

  const reference =
    payload.paymentReference ||
    `MANUAL-${booking.id.replace(/^booking-/, "").toUpperCase()}`;

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "paid",
      payment_status: "deposit_paid",
    })
    .eq("id", id);

  if (updateError) {
    return errorResponse(updateError.message, 500);
  }

  await supabase.from("payment_verifications").upsert({
    id: `verification-${id}`,
    booking_id: id,
    status: "verified",
    submitted_reference: reference,
    verified_by: adminSession.email,
    verified_at: new Date().toISOString(),
    notes: "Deposit verified manually. Worker contacts released.",
  });

  await supabase
    .from("workers")
    .update({ availability_status: "hired" })
    .in("id", payload.workerIds);

  const hireId = `hire-${id}`;
  const { error: hireError } = await supabase.from("hires").upsert({
    id: hireId,
    user_id: booking.user_id,
    booking_id: id,
    title: `${booking.title} hire`,
    status: "active",
    payment_status: "paid",
    hire_date: booking.booking_date,
    payment_reference: reference,
  });

  if (hireError) {
    return errorResponse(hireError.message, 500);
  }

  await supabase.from("hire_workers").delete().eq("hire_id", hireId);

  const { error: hireWorkersError } = await supabase.from("hire_workers").insert(
    payload.workerIds.map((workerId) => ({
      hire_id: hireId,
      worker_id: workerId,
    })),
  );

  if (hireWorkersError) {
    return errorResponse(hireWorkersError.message, 500);
  }

  await supabase.from("admin_activity_logs").insert({
    id: `activity-${randomUUID()}`,
    type: "payment_confirmed",
    actor: adminSession.email,
    message: `${booking.title} payment verified manually with reference ${reference}.`,
    booking_id: id,
    worker_id: null,
  });

  return NextResponse.json({ ok: true });
}
