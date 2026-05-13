import { ACTIVE_BOOKING_STATUSES } from "@/lib/booking-workflow";

export const WORKER_CAPACITY_SETTING_KEY = "max_active_bookings_per_worker";
export const DEFAULT_MAX_ACTIVE_BOOKINGS_PER_WORKER = 1;

export function normalizeWorkerCapacityLimit(value: unknown) {
  const limit = Math.floor(Number(value));

  if (!Number.isFinite(limit)) {
    return DEFAULT_MAX_ACTIVE_BOOKINGS_PER_WORKER;
  }

  return Math.max(limit, 1);
}

export function isActiveBookingStatus(status: string) {
  return ACTIVE_BOOKING_STATUSES.includes(
    status as (typeof ACTIVE_BOOKING_STATUSES)[number],
  );
}

export function activeBookingCountLabel(count: number) {
  return `${count} active booking${count === 1 ? "" : "s"}`;
}
