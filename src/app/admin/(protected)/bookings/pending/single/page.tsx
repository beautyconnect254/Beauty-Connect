import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookingsAsync,
  getWorkersAsync,
} from "@/lib/data-access";

export default async function AdminPendingSingleBookingsPage() {
  const [bookings, workers] = await Promise.all([
    getBookingsAsync(),
    getWorkersAsync(),
  ]);

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Pending Single Bookings"
        description="Verify the requested worker or replace them with an available match before confirmation."
      />
      <AdminBookingsClient
        initialBookings={bookings}
        initialWorkers={workers}
        initialActivityLogs={getAdminActivityLogs()}
        status="pending"
        type="worker"
      />
    </div>
  );
}
