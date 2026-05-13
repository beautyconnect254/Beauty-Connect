import { randomUUID } from "node:crypto";

import { PAYMENT_LOCK_DURATION_MINUTES } from "@/lib/booking-workflow";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export interface PaymentLockResult {
  booking_id: string;
  status: "payment_pending";
  lock_id: string;
  expires_at: string;
  worker_count: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePaymentLockResult(value: unknown): PaymentLockResult {
  if (!isRecord(value)) {
    throw new Error("Payment lock could not be created.");
  }

  return {
    booking_id: String(value.booking_id ?? ""),
    status: "payment_pending",
    lock_id: String(value.lock_id ?? ""),
    expires_at: String(value.expires_at ?? ""),
    worker_count: Math.max(Number(value.worker_count) || 0, 0),
  };
}

export function paymentLockExpiryFromNow() {
  return new Date(
    Date.now() + PAYMENT_LOCK_DURATION_MINUTES * 60 * 1000,
  ).toISOString();
}

export async function expireStalePaymentLocks() {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  try {
    await supabase.rpc("expire_stale_payment_locks");
  } catch {
    // Local previews can run before the SQL migration is applied.
  }
}

export async function startBookingPaymentLock(
  bookingId: string,
  userId: string | null,
) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Payment database is not configured.");
  }

  const lockId = `lock-${randomUUID()}`;
  const expiresAt = paymentLockExpiryFromNow();
  await expireStalePaymentLocks();
  const { data, error } = await supabase.rpc("start_booking_payment_lock", {
    target_booking_id: bookingId,
    target_user_id: userId,
    target_lock_id: lockId,
    target_expires_at: expiresAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizePaymentLockResult(data);
}

export async function releaseBookingPaymentLock(
  bookingId: string,
  lockId: string,
  reason: string,
) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Payment database is not configured.");
  }

  const { error } = await supabase.rpc("release_booking_payment_lock", {
    target_booking_id: bookingId,
    target_lock_id: lockId,
    target_reason: reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function bookingIdFromTrackingToken(token: string) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Payment database is not configured.");
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("tracking_token", token)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Booking not found.");
  }

  return data.id as string;
}
