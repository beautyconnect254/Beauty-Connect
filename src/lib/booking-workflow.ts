import type {
  Booking,
  BookingStatus,
  BookingWorkerAssignmentRecord,
  CompensationType,
  HireWorkerAssignmentRecord,
  PaymentInstructions,
  PaymentStatus,
  Worker,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "payment_pending",
  "paid",
] as const satisfies BookingStatus[];

export const LOCKING_BOOKING_STATUSES = [
  "payment_pending",
  "paid",
] as const satisfies BookingStatus[];

export const FUTURE_BOOKING_STATUSES = [
  "expired",
  "cancelled",
] as const satisfies BookingStatus[];

export const PAYMENT_LOCK_DURATION_MINUTES = 5;

export const STAFFING_WORKFLOW_STEPS = [
  "Discover workers / build team",
  "Submit booking request",
  "Pending review",
  "Availability review",
  "Confirmed",
  "Deposit payment starts",
  "Workers reserved for payment",
  "Payment verification",
  "Hired",
  "Worker contacts unlocked",
] as const;

export function bookingStatusLabel(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "payment_pending":
      return "Payment pending";
    case "paid":
      return "Paid";
    case "expired":
      return "Expired";
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
      return "Workers are selected. They lock only when deposit payment starts.";
    case "payment_pending":
      return "Deposit payment is in progress. Workers are reserved while M-Pesa confirms.";
    case "paid":
      return "Payment is verified. Worker contacts are unlocked in Hires.";
    case "expired":
      return "This booking has expired and is no longer active.";
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
    case "payment_pending":
      return "bg-purple-100 text-purple-800";
    case "confirmed":
      return "bg-emerald-100 text-emerald-800";
    case "paid":
      return "bg-teal-100 text-teal-800";
    case "expired":
      return "bg-slate-100 text-slate-700";
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
  return booking.status === "confirmed" || booking.status === "payment_pending";
}

export function bookingIsActive(status: BookingStatus) {
  return ACTIVE_BOOKING_STATUSES.includes(
    status as (typeof ACTIVE_BOOKING_STATUSES)[number],
  );
}

export function bookingLocksWorkers(status: BookingStatus) {
  return LOCKING_BOOKING_STATUSES.includes(
    status as (typeof LOCKING_BOOKING_STATUSES)[number],
  );
}

export function bookingCanStartPayment(status: BookingStatus) {
  return status === "confirmed";
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
        ? "Start deposit payment when ready. Beauty Connect reserves the whole team while M-Pesa confirms."
        : "Start deposit payment when ready. Beauty Connect reserves the worker while M-Pesa confirms.",
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

export function defaultCompensationType(worker: Pick<Worker, "primary_role">): CompensationType {
  return ["Nail Technician", "Braider", "Makeup Artist"].includes(worker.primary_role)
    ? "commission"
    : "monthly";
}

export function defaultSalaryExpectation(worker: Pick<Worker, "salary_expectation">) {
  return worker.salary_expectation > 0
    ? `${formatCurrency(worker.salary_expectation)}/month`
    : "";
}

export function defaultCommissionPercentage(
  worker: Pick<Worker, "primary_role">,
) {
  return defaultCompensationType(worker) === "commission" ? 50 : null;
}

export function normalizeCommissionPercentage(value: unknown) {
  const percentage = Number(value);

  if (!Number.isFinite(percentage)) {
    return null;
  }

  return Math.min(Math.max(Math.round(percentage), 0), 100);
}

export function compensationSummary(
  assignment: Pick<
    BookingWorkerAssignmentRecord | HireWorkerAssignmentRecord,
    "compensation_type" | "salary_expectation" | "commission_percentage"
  >,
) {
  if (assignment.compensation_type === "commission") {
    const percentage = normalizeCommissionPercentage(
      assignment.commission_percentage,
    );

    return percentage === null
      ? "Commission: to be confirmed"
      : `Commission: ${percentage}%`;
  }

  return assignment.salary_expectation || "Salary to be confirmed";
}

export function compensationSentence(
  assignment: Pick<
    BookingWorkerAssignmentRecord | HireWorkerAssignmentRecord,
    "compensation_type" | "salary_expectation" | "commission_percentage"
  >,
) {
  if (assignment.compensation_type === "commission") {
    const percentage = normalizeCommissionPercentage(
      assignment.commission_percentage,
    );

    return percentage === null
      ? "Commission to be confirmed"
      : `${percentage}% commission`;
  }

  return assignment.salary_expectation || "Salary to be confirmed";
}
