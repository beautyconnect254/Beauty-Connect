import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookingsAsync,
  getWorkersAsync,
} from "@/lib/data-access";

export default async function AdminPendingTeamBookingsPage() {
  const [bookings, workers] = await Promise.all([
    getBookingsAsync(),
    getWorkersAsync(),
  ]);

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Pending Team Bookings"
        description="Review requested roles, auto-match available workers, manually verify availability, and confirm reservations."
      />
      <AdminBookingsClient
        initialBookings={bookings}
        initialWorkers={workers}
        initialActivityLogs={getAdminActivityLogs()}
        status="pending"
        type="team"
      />
    </div>
  );
}
