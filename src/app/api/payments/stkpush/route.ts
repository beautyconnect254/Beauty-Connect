import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import {
  darajaAccountReference,
  initiateDarajaStkPush,
  normalizeMpesaPhone,
  redactedStkPayload,
} from "@/lib/daraja";
import { defaultPaymentInstructions } from "@/lib/booking-workflow";
import {
  releaseBookingPaymentLock,
  startBookingPaymentLock,
} from "@/lib/payment-locks";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { PaymentInstructions } from "@/lib/types";
import { getAuthenticatedUserFromRequest } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BookingPaymentRow {
  id: string;
  user_id: string | null;
  tracking_token: string | null;
  type: "worker" | "team";
  title: string;
  status: string;
  payment_instructions: unknown;
}

interface ExistingMpesaPaymentRow {
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  amount: number;
  phone_number: string;
  status: string;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function statusForPaymentLockError(message: string) {
  if (
    message.includes("not available") ||
    message.includes("No workers") ||
    message.includes("confirmed")
  ) {
    return 409;
  }

  if (message.includes("not found")) {
    return 404;
  }

  return 500;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parsePaymentInstructions(value: unknown): PaymentInstructions | null {
  return isRecord(value) && typeof value.deposit_amount === "number"
    ? (value as unknown as PaymentInstructions)
    : null;
}

async function readPayload(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return null;
  }

  return {
    bookingId: cleanText(body.bookingId),
    trackingToken: cleanText(body.trackingToken),
    phoneNumber: cleanText(body.phoneNumber),
  };
}

async function getBookingForPayment(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  bookingId: string,
  trackingToken: string,
) {
  let query = supabase
    .from("bookings")
    .select("id, user_id, tracking_token, type, title, status, payment_instructions")
    .limit(1);

  if (bookingId) {
    query = query.eq("id", bookingId);
  } else {
    query = query.eq("tracking_token", trackingToken);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as BookingPaymentRow;
}

async function workerCountForBooking(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  bookingId: string,
) {
  const { data, error } = await supabase
    .from("booking_workers")
    .select("worker_id")
    .eq("booking_id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).length;
}

async function existingPendingPayment(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  bookingId: string,
  lockId: string,
) {
  const { data } = await supabase
    .from("mpesa_payments")
    .select("checkout_request_id, merchant_request_id, amount, phone_number, status")
    .eq("booking_id", bookingId)
    .eq("payment_lock_id", lockId)
    .eq("status", "pending")
    .not("checkout_request_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data ?? null) as ExistingMpesaPaymentRow | null;
}

async function safeReleasePaymentLock(
  bookingId: string,
  lockId: string,
  reason: string,
) {
  try {
    await releaseBookingPaymentLock(bookingId, lockId, reason);
  } catch {
    // Keep the original payment error response. Stale locks are also cleaned up by RPC.
  }
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return errorResponse("Payment database is not configured.", 503);
  }

  const payload = await readPayload(request);

  if (!payload || (!payload.bookingId && !payload.trackingToken)) {
    return errorResponse("Booking is required.", 400);
  }

  let phoneNumber = "";

  try {
    phoneNumber = normalizeMpesaPhone(payload.phoneNumber);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Enter a valid M-Pesa phone number.",
      400,
    );
  }

  const booking = await getBookingForPayment(
    supabase,
    payload.bookingId,
    payload.trackingToken,
  );

  if (!booking) {
    return errorResponse("Booking not found.", 404);
  }

  if (!payload.trackingToken) {
    const user = await getAuthenticatedUserFromRequest(request);

    if (!user || booking.user_id !== user.id) {
      return errorResponse("Sign in before starting deposit payment.", 401);
    }
  }

  if (booking.status === "paid") {
    return errorResponse("This booking is already paid.", 409);
  }

  const workerCount = await workerCountForBooking(supabase, booking.id);
  const instructions =
    parsePaymentInstructions(booking.payment_instructions) ??
    defaultPaymentInstructions({
      id: booking.id,
      type: booking.type,
      worker_count: workerCount,
    });
  const amount = Math.max(Math.round(Number(instructions.deposit_amount)), 1);
  const accountReference = darajaAccountReference(
    instructions.payment_reference || booking.id,
  );
  const transactionDesc = "Beauty fee";
  const stkInput = {
    amount,
    phoneNumber,
    accountReference,
    transactionDesc,
  };
  let requestPayload: Record<string, unknown>;

  try {
    requestPayload = redactedStkPayload(stkInput);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Daraja is not configured.",
      503,
    );
  }

  let lock: Awaited<ReturnType<typeof startBookingPaymentLock>>;

  try {
    lock = await startBookingPaymentLock(booking.id, booking.user_id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start deposit payment.";

    return errorResponse(message, statusForPaymentLockError(message));
  }

  const existingPayment = await existingPendingPayment(
    supabase,
    booking.id,
    lock.lock_id,
  );

  if (existingPayment?.checkout_request_id) {
    return NextResponse.json({
      ok: true,
      reused: true,
      bookingId: booking.id,
      status: "payment_pending",
      checkoutRequestId: existingPayment.checkout_request_id,
      merchantRequestId: existingPayment.merchant_request_id,
      lock,
      message: "An M-Pesa prompt is already pending for this booking.",
    });
  }

  const paymentId = `mpesa-${randomUUID()}`;
  const { error: insertError } = await supabase.from("mpesa_payments").insert({
    id: paymentId,
    booking_id: booking.id,
    payment_lock_id: lock.lock_id,
    phone_number: phoneNumber,
    amount,
    account_reference: accountReference,
    transaction_desc: transactionDesc,
    status: "initiated",
    request_payload: requestPayload,
  });

  if (insertError) {
    await safeReleasePaymentLock(booking.id, lock.lock_id, insertError.message);
    return errorResponse(insertError.message, 500);
  }

  try {
    const response = await initiateDarajaStkPush(stkInput);
    const responseCode = response.ResponseCode ?? "";
    const checkoutRequestId = response.CheckoutRequestID ?? "";

    if (responseCode !== "0" || !checkoutRequestId) {
      await supabase
        .from("mpesa_payments")
        .update({
          status: "init_failed",
          result_description:
            response.ResponseDescription ||
            response.errorMessage ||
            "Daraja did not accept the STK request.",
          response_payload: response,
        })
        .eq("id", paymentId);
      await safeReleasePaymentLock(
        booking.id,
        lock.lock_id,
        response.ResponseDescription || "Daraja STK request was not accepted.",
      );

      return errorResponse(
        response.ResponseDescription ||
          response.errorMessage ||
          "Daraja did not accept the STK request.",
        502,
      );
    }

    const { error: updateError } = await supabase
      .from("mpesa_payments")
      .update({
        status: "pending",
        merchant_request_id: response.MerchantRequestID ?? null,
        checkout_request_id: checkoutRequestId,
        response_payload: response,
      })
      .eq("id", paymentId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      status: "payment_pending",
      checkoutRequestId,
      merchantRequestId: response.MerchantRequestID ?? null,
      customerMessage: response.CustomerMessage ?? "Check your phone for the M-Pesa prompt.",
      lock,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not initiate M-Pesa STK Push.";

    await supabase
      .from("mpesa_payments")
      .update({
        status: "init_failed",
        result_description: message,
      })
      .eq("id", paymentId);
    await safeReleasePaymentLock(booking.id, lock.lock_id, message);

    return errorResponse(message, 502);
  }
}
