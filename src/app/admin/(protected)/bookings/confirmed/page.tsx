import { AdminBookingStatusPage } from "@/components/admin/admin-booking-status-page";
import type { BookingType } from "@/lib/types";

function bookingTypeFromSearchParam(value: string | string[] | undefined): BookingType {
  return value === "team" ? "team" : "worker";
}

export default async function AdminConfirmedBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const params = await searchParams;

  return (
    <AdminBookingStatusPage
      status="confirmed"
      type={bookingTypeFromSearchParam(params.type)}
    />
  );
}
