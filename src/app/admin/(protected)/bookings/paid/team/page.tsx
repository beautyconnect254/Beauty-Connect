import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookingsAsync,
  getWorkerCapacitySettingsAsync,
  getWorkersAsync,
} from "@/lib/data-access";

export default async function AdminPaidTeamBookingsPage() {
  const [bookings, workers, capacitySettings] = await Promise.all([
    getBookingsAsync(),
    getWorkersAsync(),
    getWorkerCapacitySettingsAsync(),
  ]);

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Paid Team Bookings"
        description="Review released teams, hire dates, payment confirmation, and worker contact release state."
      />
      <AdminBookingsClient
        initialBookings={bookings}
        initialWorkers={workers}
        initialActivityLogs={getAdminActivityLogs()}
        status="paid"
        type="team"
        capacityLimit={capacitySettings.max_active_bookings_per_worker}
      />
    </div>
  );
}
