import type {
  Booking,
  BookingStatus,
  PaymentInstructions,
  PaymentStatus,
  Worker,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "paid",
] as const satisfies BookingStatus[];

export const FUTURE_BOOKING_STATUSES = [
  "cancelled",
] as const satisfies BookingStatus[];

export const STAFFING_WORKFLOW_STEPS = [
  "Discover workers / build team",
  "Submit booking request",
  "Pending review",
  "Availability review",
  "Confirmed",
  "Payment instructions sent",
  "Manual payment verification",
  "Hired",
  "Worker contacts unlocked",
] as const;

export function bookingStatusLabel(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "paid":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function bookingStatusDescription(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Beauty Connect is matching workers and manually verifying availability.";
    case "confirmed":
      return "Workers are reserved. Deposit verification is pending.";
    case "paid":
      return "Payment is verified. Worker contacts are unlocked in Hires.";
    case "cancelled":
      return "This booking is no longer active.";
    default:
      return "";
  }
}

export function paymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "deposit_due":
      return "Deposit due";
    case "deposit_paid":
      return "Deposit paid";
    case "paid":
      return "Paid";
    default:
      return "Not due";
  }
}

export function bookingStatusClass(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-800";
    case "paid":
      return "bg-teal-100 text-teal-800";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export function paymentStatusClass(status: PaymentStatus) {
  switch (status) {
    case "deposit_due":
      return "bg-amber-100 text-amber-800";
    case "deposit_paid":
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function canUnlockWorkerContacts(status: BookingStatus | "hire") {
  return status === "paid" || status === "hire";
}

export function bookingRequiresPayment(booking: Pick<Booking, "status">) {
  return booking.status === "confirmed";
}

export function bookingIsActive(status: BookingStatus) {
  return ACTIVE_BOOKING_STATUSES.includes(
    status as (typeof ACTIVE_BOOKING_STATUSES)[number],
  );
}

export function defaultPaymentInstructions(
  booking: Pick<Booking, "id" | "worker_count" | "type">,
): PaymentInstructions {
  const reference = `BC-${booking.id.replace(/^booking-/, "").toUpperCase()}`;
  const depositAmount = Math.max(booking.worker_count, 1) * 5000;

  return {
    mpesa_paybill: "400200",
    mpesa_account: reference,
    bank_name: "Beauty Connect Operations Bank",
    bank_account_name: "Beauty Connect Staffing",
    bank_account_number: "0123456789",
    deposit_amount: depositAmount,
    payment_reference: reference,
    notes:
      booking.type === "team"
        ? "Pay the deposit after confirmation. Beauty Connect verifies manually before team contacts unlock."
        : "Pay the deposit after confirmation. Beauty Connect verifies manually before worker contact unlocks.",
  };
}

export function paymentInstructionSummary(instructions: PaymentInstructions) {
  return `${formatCurrency(instructions.deposit_amount)} deposit, ref ${instructions.payment_reference}`;
}

export function workerContactPhone(worker: Worker) {
  return worker.whatsapp_number;
}

export function workerWhatsappHref(worker: Worker) {
  const normalized = worker.whatsapp_number.replace(/[^\d]/g, "");
  return `https://wa.me/${normalized}`;
}
