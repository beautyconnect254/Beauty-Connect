import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookings,
  getWorkers,
} from "@/lib/data-access";

export default function AdminPendingSingleBookingsPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Pending Single Bookings"
        description="Verify the requested worker or replace them with an available match before confirmation."
      />
      <AdminBookingsClient
        initialBookings={getBookings()}
        initialWorkers={getWorkers()}
        initialActivityLogs={getAdminActivityLogs()}
        status="pending"
        type="worker"
      />
    </div>
  );
}
