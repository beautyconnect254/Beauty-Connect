import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookingsAsync,
  getWorkerCapacitySettingsAsync,
  getWorkersAsync,
} from "@/lib/data-access";

export default async function AdminPendingSingleBookingsPage() {
  const [bookings, workers, capacitySettings] = await Promise.all([
    getBookingsAsync(),
    getWorkersAsync(),
    getWorkerCapacitySettingsAsync(),
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
        capacityLimit={capacitySettings.max_active_bookings_per_worker}
      />
    </div>
  );
}
