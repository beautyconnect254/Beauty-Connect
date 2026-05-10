import { AdminSpecialtiesClient } from "@/components/admin/admin-specialties-client";
import { PageIntro } from "@/components/shared/page-intro";
import { getRoleSpecialtyCatalog } from "@/lib/data-access";

export default function AdminSubSpecialtiesPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Specialties"
        title="Sub-Specialties"
        description="Nest specialties under roles so matching, onboarding, and filters stay data-driven."
      />
      <AdminSpecialtiesClient
        initialCatalog={getRoleSpecialtyCatalog()}
        mode="sub-specialties"
      />
    </div>
  );
}
