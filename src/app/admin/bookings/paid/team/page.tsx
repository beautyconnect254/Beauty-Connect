import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookings,
  getWorkers,
} from "@/lib/data-access";

export default function AdminPaidTeamBookingsPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Paid Team Bookings"
        description="Review released teams, hire dates, payment confirmation, and worker contact release state."
      />
      <AdminBookingsClient
        initialBookings={getBookings()}
        initialWorkers={getWorkers()}
        initialActivityLogs={getAdminActivityLogs()}
        status="paid"
        type="team"
      />
    </div>
  );
}
