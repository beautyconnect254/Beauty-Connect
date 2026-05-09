import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { buttonVariants } from "@/components/ui/button";
import { WorkersExplorer } from "@/components/workers/workers-explorer";
import { getLocations, getPublicWorkers, getSkills } from "@/lib/data-access";

export default function WorkersPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageIntro
          eyebrow="Verified directory"
          title="Browse beauty professionals already reviewed for shortlist-ready hiring."
          description="Filter by skill, location, experience, availability, and verification to find workers that fit your service floor and launch timeline."
          actions={
            <Link href="/team-builder" className={buttonVariants({ variant: "default" })}>
              Build a team request
            </Link>
          }
        />

        <WorkersExplorer
          workers={getPublicWorkers()}
          skills={getSkills()}
          locations={getLocations()}
        />
      </div>
    </SiteShell>
  );
}
