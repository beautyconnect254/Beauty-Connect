import { ProtectedLink } from "@/components/auth/protected-link";
import { SiteShell } from "@/components/layout/site-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { buttonVariants } from "@/components/ui/button";
import { WorkersExplorer } from "@/components/workers/workers-explorer";
import {
  getPublicWorkersAsync,
  getSkillsAsync,
} from "@/lib/data-access";

export const dynamic = "force-dynamic";

interface WorkersPageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function WorkersPage({ searchParams }: WorkersPageProps) {
  const { role } = await searchParams;
  const [workers, skills] = await Promise.all([
    getPublicWorkersAsync(),
    getSkillsAsync(),
  ]);
  const locations = Array.from(
    new Set(workers.map((worker) => worker.location)),
  ).sort();

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
        <PageIntro
          eyebrow="Workers"
          title="Browse Verified Workers"
          description="Filter by role, skill, location, experience, and availability."
          actions={
            <ProtectedLink
              href="/team-builder"
              intentTitle="Sign in to build your team"
              className={buttonVariants({ variant: "default" })}
            >
              Build Team
            </ProtectedLink>
          }
        />

        <WorkersExplorer
          workers={workers}
          skills={skills}
          locations={locations}
          initialRole={role}
        />
      </div>
    </SiteShell>
  );
}
