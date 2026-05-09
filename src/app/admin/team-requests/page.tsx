import { AdminTeamRequestsClient } from "@/components/admin/admin-team-requests-client";
import { PageIntro } from "@/components/shared/page-intro";
import { getTeamRequests, getWorkers } from "@/lib/data-access";

export default function AdminTeamRequestsPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Team requests"
        title="Operate the staffing pipeline from request intake through worker placement."
        description="Review owner demand, assign verified workers, reserve talent without double-booking, and mark requests complete once placements are confirmed."
      />

      <AdminTeamRequestsClient
        initialRequests={getTeamRequests()}
        initialWorkers={getWorkers()}
      />
    </div>
  );
}
