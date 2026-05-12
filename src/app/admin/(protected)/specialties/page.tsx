import { AdminSpecialtiesClient } from "@/components/admin/admin-specialties-client";
import { PageIntro } from "@/components/shared/page-intro";
import { getRoleSpecialtyCatalogAsync } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminSpecialtiesIndexPage() {
  const catalog = await getRoleSpecialtyCatalogAsync();

  return (
    <div className="space-y-4">
      <PageIntro
        eyebrow="Specialties"
        title="Specialties"
        description="Create title specialities and the sub-specialities nested under each title."
      />
      <AdminSpecialtiesClient initialCatalog={catalog} />
    </div>
  );
}
