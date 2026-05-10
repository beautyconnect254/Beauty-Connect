import { AdminFeaturedWorkersClient } from "@/components/admin/admin-featured-workers-client";
import { PageIntro } from "@/components/shared/page-intro";
import { getWorkers } from "@/lib/data-access";

export default function AdminFeaturedWorkersPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Promotion"
        title="Featured Workers"
        description="Control featured placement separately from staffing availability and booking status."
      />
      <AdminFeaturedWorkersClient initialWorkers={getWorkers()} />
    </div>
  );
}
