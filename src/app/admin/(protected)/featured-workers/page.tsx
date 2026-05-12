import { AdminFeaturedWorkersClient } from "@/components/admin/admin-featured-workers-client";
import { PageIntro } from "@/components/shared/page-intro";
import { getWorkersAsync } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedWorkersPage() {
  const workers = await getWorkersAsync();

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Promotion"
        title="Featured Workers"
        description="Control featured placement separately from staffing availability and booking status."
      />
      <AdminFeaturedWorkersClient initialWorkers={workers} />
    </div>
  );
}
