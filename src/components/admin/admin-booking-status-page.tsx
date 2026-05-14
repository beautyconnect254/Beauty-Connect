import Link from "next/link";

import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogsAsync,
  getBookingsAsync,
  getWorkerCapacitySettingsAsync,
  getWorkersAsync,
} from "@/lib/data-access";
import type { BookingStatus, BookingType } from "@/lib/types";
import { cn } from "@/lib/utils";

type AdminBookingStatus = Extract<
  BookingStatus,
  "pending" | "confirmed" | "paid"
>;

interface AdminBookingStatusPageProps {
  status: AdminBookingStatus;
  type: BookingType;
}

const statusCopy: Record<
  AdminBookingStatus,
  { title: string; description: string }
> = {
  pending: {
    title: "Pending Bookings",
    description:
      "Review new booking requests, verify worker availability, and confirm compensation before deposit collection.",
  },
  confirmed: {
    title: "Confirmed Bookings",
    description:
      "Track confirmed bookings and internal payment locks while Daraja payment completion remains the source of truth.",
  },
  paid: {
    title: "Paid Bookings",
    description:
      "Review paid hires, released contacts, payment references, and final worker assignments.",
  },
};

function typeLabel(type: BookingType) {
  return type === "worker" ? "Single" : "Team";
}

export async function AdminBookingStatusPage({
  status,
  type,
}: AdminBookingStatusPageProps) {
  const [bookings, workers, capacitySettings, activityLogs] = await Promise.all([
    getBookingsAsync(),
    getWorkersAsync(),
    getWorkerCapacitySettingsAsync(),
    getAdminActivityLogsAsync(),
  ]);
  const copy = statusCopy[status];
  const statusFilter =
    status === "confirmed" ? (["confirmed", "payment_pending"] as const) : [status];

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title={`${copy.title} - ${typeLabel(type)}`}
        description={copy.description}
      />

      <div className="flex w-full flex-wrap gap-2 rounded-lg border border-[color:var(--border)] bg-white/80 p-1 shadow-sm">
        {(["worker", "team"] as const).map((bookingType) => (
          <Link
            key={bookingType}
            href={`/admin/bookings/${status}?type=${
              bookingType === "worker" ? "single" : "team"
            }`}
            className={cn(
              "inline-flex h-9 min-w-24 items-center justify-center rounded-md px-4 text-sm font-extrabold transition",
              type === bookingType
                ? "bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white shadow-sm"
                : "text-[color:var(--foreground)] hover:bg-[color:var(--muted)]",
            )}
          >
            {typeLabel(bookingType)}
          </Link>
        ))}
      </div>

      <AdminBookingsClient
        initialBookings={bookings}
        initialWorkers={workers}
        initialActivityLogs={activityLogs}
        status={status}
        statusFilter={[...statusFilter]}
        type={type}
        capacityLimit={capacitySettings.max_active_bookings_per_worker}
      />
    </div>
  );
}
