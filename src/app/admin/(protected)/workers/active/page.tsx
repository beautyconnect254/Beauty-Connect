import { AdminActiveWorkersClient } from "@/components/admin/admin-active-workers-client";
import { PageIntro } from "@/components/shared/page-intro";
import { getWorkersAsync } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminActiveWorkersPage() {
  const workers = await getWorkersAsync();

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Workers"
        title="Active Workers"
        description="Scan the roster, adjust listing state, update worker status, and inspect booking history."
      />
      <AdminActiveWorkersClient initialWorkers={workers} />
    </div>
  );
}
