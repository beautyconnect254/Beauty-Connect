import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookingsAsync,
  getWorkersAsync,
} from "@/lib/data-access";

export default async function AdminConfirmedSingleBookingsPage() {
  const [bookings, workers] = await Promise.all([
    getBookingsAsync(),
    getWorkersAsync(),
  ]);

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Confirmed Single Bookings"
        description="Keep single-worker reservations blocked from matching until deposit payment is verified."
      />
      <AdminBookingsClient
        initialBookings={bookings}
        initialWorkers={workers}
        initialActivityLogs={getAdminActivityLogs()}
        status="confirmed"
        type="worker"
      />
    </div>
  );
}
