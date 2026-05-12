import { AdminWorkerOnboardingClient } from "@/components/admin/admin-worker-onboarding-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getRoleSpecialtyCatalogAsync,
  getWorkersAsync,
} from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminListWorkerPage() {
  const [workers, roleCatalog] = await Promise.all([
    getWorkersAsync(),
    getRoleSpecialtyCatalogAsync(),
  ]);
  const locations = Array.from(
    new Set(workers.map((worker) => worker.location)),
  ).sort();

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Workers"
        title="List Worker"
        description="Create a staffing-ready worker record with role, sub-specialties, evidence, status, and listing controls."
      />
      <AdminWorkerOnboardingClient
        initialWorkers={workers}
        roleCatalog={roleCatalog}
        locations={locations}
      />
    </div>
  );
}
