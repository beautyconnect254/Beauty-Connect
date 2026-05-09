import { AdminWorkersClient } from "@/components/admin/admin-workers-client";
import { PageIntro } from "@/components/shared/page-intro";
import { getLocations, getSkills, getWorkers } from "@/lib/data-access";
import type { WorkerRole } from "@/lib/types";

const roles: WorkerRole[] = [
  "Hair Stylist",
  "Barber",
  "Nail Technician",
  "Makeup Artist",
  "Spa Therapist",
  "Lash Technician",
  "Braider",
  "Wig Specialist",
];

export default function AdminWorkersPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Worker management"
        title="Recruit, onboard, verify, and activate beauty workers through one internal flow."
        description="Admins manually source every worker in V1. Use the onboarding wizard to capture details, verify references, prepare portfolio evidence, and move workers into staffing-ready availability states."
      />

      <AdminWorkersClient
        initialWorkers={getWorkers()}
        roles={roles}
        locations={getLocations()}
        skillCatalog={getSkills()}
      />
    </div>
  );
}
