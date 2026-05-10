import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { buttonVariants } from "@/components/ui/button";
import { WorkersExplorer } from "@/components/workers/workers-explorer";
import { getLocations, getPublicWorkers, getSkills } from "@/lib/data-access";

interface WorkersPageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function WorkersPage({ searchParams }: WorkersPageProps) {
  const { role } = await searchParams;

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageIntro
          eyebrow="Workers"
          title="Browse Verified Workers"
          description="Filter by role, skill, location, experience, and availability."
          actions={
            <Link href="/team-builder" className={buttonVariants({ variant: "default" })}>
              Build Team
            </Link>
          }
        />

        <WorkersExplorer
          workers={getPublicWorkers()}
          skills={getSkills()}
          locations={getLocations()}
          initialRole={role}
        />
      </div>
    </SiteShell>
  );
}
