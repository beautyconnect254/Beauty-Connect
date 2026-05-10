import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookings,
  getWorkers,
} from "@/lib/data-access";

export default function AdminPendingTeamBookingsPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Pending Team Bookings"
        description="Review requested roles, auto-match available workers, manually verify availability, and confirm reservations."
      />
      <AdminBookingsClient
        initialBookings={getBookings()}
        initialWorkers={getWorkers()}
        initialActivityLogs={getAdminActivityLogs()}
        status="pending"
        type="team"
      />
    </div>
  );
}
