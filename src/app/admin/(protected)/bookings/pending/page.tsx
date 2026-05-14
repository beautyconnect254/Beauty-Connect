import { AdminBookingStatusPage } from "@/components/admin/admin-booking-status-page";
import type { BookingType } from "@/lib/types";

function bookingTypeFromSearchParam(value: string | string[] | undefined): BookingType {
  return value === "team" ? "team" : "worker";
}

export default async function AdminPendingBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const params = await searchParams;

  return (
    <AdminBookingStatusPage
      status="pending"
      type={bookingTypeFromSearchParam(params.type)}
    />
  );
}
