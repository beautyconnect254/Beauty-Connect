import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookingsAsync,
  getWorkerCapacitySettingsAsync,
  getWorkersAsync,
} from "@/lib/data-access";

export default async function AdminPaidSingleBookingsPage() {
  const [bookings, workers, capacitySettings] = await Promise.all([
    getBookingsAsync(),
    getWorkersAsync(),
    getWorkerCapacitySettingsAsync(),
  ]);

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Paid Single Bookings"
        description="Review released single-worker hires, manual payment confirmation, and contact access."
      />
      <AdminBookingsClient
        initialBookings={bookings}
        initialWorkers={workers}
        initialActivityLogs={getAdminActivityLogs()}
        status="paid"
        type="worker"
        capacityLimit={capacitySettings.max_active_bookings_per_worker}
      />
    </div>
  );
}
