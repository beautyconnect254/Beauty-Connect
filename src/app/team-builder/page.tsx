import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { TeamBuilderClient } from "@/components/team-builder/team-builder-client";
import {
  getLocations,
  getSkills,
  getWorkerCategories,
  getWorkers,
} from "@/lib/data-access";

export default function TeamBuilderPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageIntro
          eyebrow="Team builder"
          title="Build a salon workforce request with role-by-role staffing clarity."
          description="Define the team you need, set minimum experience and specialties, then hand the request to Beauty Connect for curated internal matching and worker reservation."
        />

        <TeamBuilderClient
          workers={getWorkers()}
          categories={getWorkerCategories()}
          locations={getLocations()}
          skills={getSkills()}
        />
      </div>
    </SiteShell>
  );
}
