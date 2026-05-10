import { AdminSpecialtiesClient } from "@/components/admin/admin-specialties-client";
import { PageIntro } from "@/components/shared/page-intro";
import { getRoleSpecialtyCatalog } from "@/lib/data-access";

export default function AdminRolesPage() {
  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Specialties"
        title="Roles"
        description="Maintain the main worker roles used by onboarding, filters, team builder, and matching."
      />
      <AdminSpecialtiesClient
        initialCatalog={getRoleSpecialtyCatalog()}
        mode="roles"
      />
    </div>
  );
}
