import { AdminWorkerOnboardingClient } from "@/components/admin/admin-worker-onboarding-client";
import { PageIntro } from "@/components/shared/page-intro";
import {
  getLocations,
  getRoleSpecialtyCatalog,
  getWorkers,
} from "@/lib/data-access";

export default function AdminListWorkerPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Workers"
        title="List Worker"
        description="Create a staffing-ready worker record with role, sub-specialties, evidence, status, and listing controls."
      />
      <AdminWorkerOnboardingClient
        initialWorkers={getWorkers()}
        roleCatalog={getRoleSpecialtyCatalog()}
        locations={getLocations()}
      />
    </div>
  );
}
