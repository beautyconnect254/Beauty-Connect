import type { Booking, BookingStatus, TeamWorkType, Worker } from "@/lib/types";

export const LOCAL_BOOKINGS_KEY = "beauty-connect.local-bookings.v1";

export interface TeamBookingDraft {
  salonName: string;
  workType: TeamWorkType;
  targetStartDate: string;
  roles: Array<{
    role: string;
    quantity: number;
    experienceLabel: string;
    specialtyNames: string[];
  }>;
}

export interface SingleBookingDraft {
  salonName: string;
  contactName: string;
  contactNumber: string;
  location: string;
  preferredStartDate: string;
  worker: Worker;
}

export function teamWorkTypeLabel(workType: TeamWorkType) {
  return workType === "short-term-contract"
    ? "Short-Term Contract"
    : "Long-Term Contract";
}

export function readLocalBookings(): Booking[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_BOOKINGS_KEY);
    return raw ? (JSON.parse(raw) as Booking[]).map(normalizeLocalBooking) : [];
  } catch {
    return [];
  }
}

function normalizeLocalBooking(booking: Booking): Booking {
  const legacyStatus = booking.status as string;

  return {
    ...booking,
    status:
      legacyStatus === "pending_review"
        ? "pending"
        : legacyStatus === "hired"
          ? "paid"
          : booking.status,
    payment_instructions: booking.payment_instructions ?? null,
    payment_verification: booking.payment_verification ?? null,
  };
}

export function saveLocalBooking(booking: Booking) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readLocalBookings().filter((item) => item.id !== booking.id);
  window.localStorage.setItem(
    LOCAL_BOOKINGS_KEY,
    JSON.stringify([booking, ...current]),
  );
}

export function makeLocalTeamBooking(draft: TeamBookingDraft): Booking {
  const headcount = draft.roles.reduce((total, role) => total + role.quantity, 0);
  const roleSummary = draft.roles
    .map((role) => `${role.quantity} ${role.role}`)
    .join(", ");

  return {
    id: `local-team-${Date.now().toString(36)}`,
    type: "team",
    title: `${draft.salonName} team request`,
    status: "pending" satisfies BookingStatus,
    payment_status: "not_due",
    booking_date: draft.targetStartDate || new Date().toISOString().slice(0, 10),
    submitted_at: new Date().toISOString(),
    worker_ids: [],
    team_request_id: null,
    notes: `${teamWorkTypeLabel(draft.workType)}. Requested roles: ${roleSummary}.`,
    payment_instructions: null,
    payment_verification: null,
    workers: [],
    team_request: null,
    worker_count: headcount,
  };
}

export function makeLocalSingleBooking(draft: SingleBookingDraft): Booking {
  return {
    id: `local-single-${draft.worker.id}-${Date.now().toString(36)}`,
    type: "worker",
    title: `${draft.worker.full_name} single booking`,
    status: "pending",
    payment_status: "not_due",
    booking_date:
      draft.preferredStartDate || new Date().toISOString().slice(0, 10),
    submitted_at: new Date().toISOString(),
    worker_ids: [draft.worker.id],
    team_request_id: null,
    notes: `${draft.salonName}. Contact: ${draft.contactName}, ${draft.contactNumber}. Location: ${draft.location}.`,
    payment_instructions: null,
    payment_verification: null,
    workers: [draft.worker],
    team_request: null,
    worker_count: 1,
  };
}
