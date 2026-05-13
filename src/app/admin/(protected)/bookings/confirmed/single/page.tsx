import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookingsAsync,
  getWorkerCapacitySettingsAsync,
  getWorkersAsync,
} from "@/lib/data-access";

export default async function AdminConfirmedSingleBookingsPage() {
  const [bookings, workers, capacitySettings] = await Promise.all([
    getBookingsAsync(),
    getWorkersAsync(),
    getWorkerCapacitySettingsAsync(),
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
        capacityLimit={capacitySettings.max_active_bookings_per_worker}
      />
    </div>
  );
}
