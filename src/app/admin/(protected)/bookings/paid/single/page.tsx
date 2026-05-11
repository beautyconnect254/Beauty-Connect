import { AdminBookingsClient } from "@/components/admin/admin-bookings-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getAdminActivityLogs,
  getBookings,
  getWorkers,
} from "@/lib/data-access";

export default function AdminPaidSingleBookingsPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Bookings"
        title="Paid Single Bookings"
        description="Review released single-worker hires, manual payment confirmation, and contact access."
      />
      <AdminBookingsClient
        initialBookings={getBookings()}
        initialWorkers={getWorkers()}
        initialActivityLogs={getAdminActivityLogs()}
        status="paid"
        type="worker"
      />
    </div>
  );
}
