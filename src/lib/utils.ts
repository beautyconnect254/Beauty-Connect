import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type {
  AvailabilityStatus,
  StaffingAssignmentStatus,
  TeamRequestRole,
  TeamRequestStatus,
  TeamRequestUrgency,
  VerificationStatus,
} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function availabilityLabel(status: AvailabilityStatus) {
  switch (status) {
    case "available":
      return "Available";
    case "reserved":
      return "Reserved";
    case "hired":
      return "Hired";
    default:
      return status;
  }
}

export function verificationLabel(status: VerificationStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export function requestStatusLabel(status: TeamRequestStatus) {
  switch (status) {
    case "new":
      return "New";
    case "reviewing":
      return "Reviewing";
    case "staffing":
      return "Staffing";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

export function urgencyLabel(urgency: TeamRequestUrgency) {
  switch (urgency) {
    case "standard":
      return "Standard";
    case "priority":
      return "Priority";
    case "urgent":
      return "Urgent";
    default:
      return urgency;
  }
}

export function assignmentStatusLabel(status: StaffingAssignmentStatus) {
  switch (status) {
    case "recommended":
      return "Recommended";
    case "reserved":
      return "Reserved";
    case "hired":
      return "Hired";
    case "released":
      return "Released";
    default:
      return status;
  }
}

export function compactRoles(roles: Array<Pick<TeamRequestRole, "role" | "quantity">>) {
  return roles
    .filter((item) => item.quantity > 0)
    .map((item) => `${item.quantity} ${item.role}${item.quantity > 1 ? "s" : ""}`)
    .join(", ");
}

export function totalHeadcount(roles: Array<Pick<TeamRequestRole, "quantity">>) {
  return roles.reduce((total, item) => total + item.quantity, 0);
}
