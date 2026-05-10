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
      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageIntro
          eyebrow="Bookings"
          title="Build Your Salon Team"
          description="Choose roles, experience, location, and worker skills."
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
