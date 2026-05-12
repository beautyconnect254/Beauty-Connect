import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookingsAsync,
  getWorkersAsync,
} from "@/lib/data-access";

export default async function AdminConfirmedTeamBookingsPage() {
  const [bookings, workers] = await Promise.all([
    getBookingsAsync(),
    getWorkersAsync(),
  ]);

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Confirmed Team Bookings"
        description="Manage reserved teams, client payment instructions, and manual deposit verification."
      />
      <AdminBookingsClient
        initialBookings={bookings}
        initialWorkers={workers}
        initialActivityLogs={getAdminActivityLogs()}
        status="confirmed"
        type="team"
      />
    </div>
  );
}
