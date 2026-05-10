import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookings,
  getWorkers,
} from "@/lib/data-access";

export default function AdminConfirmedTeamBookingsPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Confirmed Team Bookings"
        description="Manage reserved teams, client payment instructions, and manual deposit verification."
      />
      <AdminBookingsClient
        initialBookings={getBookings()}
        initialWorkers={getWorkers()}
        initialActivityLogs={getAdminActivityLogs()}
        status="confirmed"
        type="team"
      />
    </div>
  );
}
