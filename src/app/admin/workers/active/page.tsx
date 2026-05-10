import { AdminActiveWorkersClient } from "@/components/admin/admin-active-workers-client";
import { PageIntro } from "@/components/shared/page-intro";
import { getWorkers } from "@/lib/data-access";

export default function AdminActiveWorkersPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Workers"
        title="Active Workers"
        description="Scan the roster, adjust listing state, update worker status, and inspect booking history."
      />
      <AdminActiveWorkersClient initialWorkers={getWorkers()} />
    </div>
  );
}
